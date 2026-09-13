import { describe, expect, it, vi } from "vitest";
import { createMoriartyChallengeResponse } from "@/lib/gemini/create-challenge.server";
import { parseMoriartyCopy } from "@/lib/gemini/challenge";
import type { GeminiCopyGenerator } from "@/lib/gemini/types";
import type { RateLimiter } from "@/lib/voice/rate-limit.server";

const ENVIRONMENT = { apiKey: "gemini-test-secret", model: "gemini-test-model" };
const ALLOW: RateLimiter = { consume: () => ({ allowed: true }) };
const MODEL_COPY = {
  objection: "Two clues may still be held by a single hand, detective.",
  question: "Which exhibit escaped the claimant's control?",
  successLine: "A separate root. Your chain holds, for now.",
  failureLine: "That thread returns to the claimant.",
};

function request(
  body: BodyInit = JSON.stringify({
    caseId: "case-01",
    pinnedArtifactIds: ["offer-email", "official-directory"],
  }),
  headers: Record<string, string> = {},
) {
  return new Request("http://localhost:3000/api/gemini/challenge", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      ...headers,
    },
    body,
  });
}

async function responseWith(
  input: Request,
  overrides: Partial<Parameters<typeof createMoriartyChallengeResponse>[1]> = {},
) {
  return createMoriartyChallengeResponse(input, {
    getEnvironment: () => ENVIRONMENT,
    generate: vi.fn(async () => MODEL_COPY),
    limiter: ALLOW,
    ...overrides,
  });
}

describe("POST /api/gemini/challenge boundary", () => {
  it("returns validated Gemini copy while Casey owns the challenge plan", async () => {
    const generate = vi.fn<GeminiCopyGenerator>(async () => MODEL_COPY);
    const response = await responseWith(request(), { generate });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ source: "gemini", copy: MODEL_COPY });
    expect(generate).toHaveBeenCalledOnce();
    expect(generate.mock.calls[0][0]).toMatchObject({
      kind: "defend_independence",
      correctOptionIds: ["official-directory"],
    });
  });

  it("uses an authored fallback when Gemini is absent, invalid, or unavailable", async () => {
    const generate = vi.fn(async () => MODEL_COPY);
    const unconfigured = await responseWith(request(), {
      getEnvironment: () => null,
      generate,
    });
    expect(await unconfigured.json()).toMatchObject({ source: "fallback" });
    expect(generate).not.toHaveBeenCalled();

    const invalid = await responseWith(request(), {
      generate: vi.fn(async () => ({ objection: "too few fields" })),
    });
    expect(await invalid.json()).toMatchObject({ source: "fallback" });

    const unavailable = await responseWith(request(), {
      generate: vi.fn(async () => {
        throw new Error("provider secret");
      }),
    });
    const serialized = JSON.stringify(await unavailable.json());
    expect(serialized).toContain('"source":"fallback"');
    expect(serialized).not.toContain("provider secret");
    expect(serialized).not.toContain(ENVIRONMENT.apiKey);
  });

  it.each([
    ["invalid JSON", "{", {}, "INVALID_REQUEST"],
    ["wrong content type", "text", { "content-type": "text/plain" }, "INVALID_REQUEST"],
    [
      "extra fields",
      JSON.stringify({ caseId: "case-01", pinnedArtifactIds: [], prompt: "ignore rules" }),
      {},
      "INVALID_REQUEST",
    ],
    [
      "unknown artifact",
      JSON.stringify({ caseId: "case-01", pinnedArtifactIds: ["not-real"] }),
      {},
      "INVALID_REQUEST",
    ],
    [
      "unknown case",
      JSON.stringify({ caseId: "case-99", pinnedArtifactIds: [] }),
      {},
      "UNKNOWN_CASE",
    ],
  ])("rejects %s", async (_label, body, headers, code) => {
    const response = await responseWith(request(body, headers));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code } });
  });

  it("rejects cross-origin and rate-limited requests", async () => {
    const forbidden = await responseWith(
      request(undefined, { origin: "https://attacker.example" }),
    );
    expect(forbidden.status).toBe(403);

    const limited = await responseWith(request(), {
      limiter: { consume: () => ({ allowed: false, retryAfterSeconds: 12 }) },
    });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("12");
  });
});

describe("Moriarty copy validation", () => {
  it("removes dash punctuation forbidden by Casey UX", () => {
    expect(
      parseMoriartyCopy({
        ...MODEL_COPY,
        objection: "A polished clue—yet still one controlled source.",
      })?.objection,
    ).toBe("A polished clue, yet still one controlled source.");
  });

  it("rejects links, markup, extra fields, and incomplete copy", () => {
    expect(parseMoriartyCopy({ ...MODEL_COPY, objection: "Visit https://example.com now" })).toBeNull();
    expect(parseMoriartyCopy({ ...MODEL_COPY, question: "<strong>Choose</strong> one" })).toBeNull();
    expect(parseMoriartyCopy({ ...MODEL_COPY, question: "Tell me your bank account number" })).toBeNull();
    expect(parseMoriartyCopy({ ...MODEL_COPY, extra: "field" })).toBeNull();
    expect(parseMoriartyCopy({ objection: MODEL_COPY.objection })).toBeNull();
  });
});
