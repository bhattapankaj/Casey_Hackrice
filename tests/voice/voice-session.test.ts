import { describe, expect, it, vi } from "vitest";
import { buildCaseVariables } from "@/lib/voice/case-variables";
import { createVoiceSessionResponse } from "@/lib/voice/create-session.server";
import type { ProviderFetcher } from "@/lib/voice/elevenlabs.server";
import { CASE_01 } from "@/lib/cases/case-01";
import type { RateLimiter } from "@/lib/voice/rate-limit.server";
import { parsePressureToolPayload } from "@/lib/voice/pressure-tactics";
import type { VoiceEnvironment, VoiceLogEvent } from "@/lib/voice/types";

const ENVIRONMENT: VoiceEnvironment = {
  apiKey: "test-secret-key",
  agentId: "agent_casey_test",
};
const ALLOW: RateLimiter = { consume: () => ({ allowed: true }) };

function request(
  body: BodyInit = JSON.stringify({ caseId: "case-01" }),
  headers: Record<string, string> = {},
) {
  return new Request("http://localhost:3000/api/voice-session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      ...headers,
    },
    body,
  });
}

function successFetcher() {
  return vi.fn<ProviderFetcher>(async () =>
    Response.json({ token: "provider-token", conversation_id: "conversation-id" }),
  );
}

async function responseWith(
  input: Request,
  overrides: Partial<Parameters<typeof createVoiceSessionResponse>[1]> = {},
) {
  return createVoiceSessionResponse(input, {
    getEnvironment: () => ENVIRONMENT,
    limiter: ALLOW,
    fetcher: successFetcher(),
    createRequestId: () => "request-id",
    now: () => 1_000,
    ...overrides,
  });
}

describe("POST /api/voice-session boundary", () => {
  it("returns 503 without configuration and does not call the provider", async () => {
    const fetcher = vi.fn();
    const response = await responseWith(request(), {
      getEnvironment: () => null,
      fetcher,
    });
    expect(response.status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ error: { code: "VOICE_NOT_CONFIGURED" } });
  });

  it.each([
    ["invalid JSON", "{", {}, "INVALID_REQUEST"],
    ["wrong content type", "text", { "content-type": "text/plain" }, "INVALID_REQUEST"],
    [
      "extra fields",
      JSON.stringify({ caseId: "case-01", agentId: "attacker" }),
      {},
      "INVALID_REQUEST",
    ],
    ["unknown case", JSON.stringify({ caseId: "case-02" }), {}, "UNKNOWN_CASE"],
  ])("rejects %s", async (_label, body, headers, code) => {
    const response = await responseWith(request(body, headers));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code } });
  });

  it("rejects a cross-origin request", async () => {
    const response = await responseWith(
      request(JSON.stringify({ caseId: "case-01" }), { origin: "https://attacker.example" }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  it("returns a retry hint when locally rate limited", async () => {
    const response = await responseWith(request(), {
      limiter: { consume: () => ({ allowed: false, retryAfterSeconds: 23 }) },
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("23");
  });

  it("uses the server agent ID and API header without leaking either", async () => {
    const fetcher = successFetcher();
    const response = await responseWith(request(), { fetcher });
    const [input, init] = fetcher.mock.calls[0];
    const url = new URL(String(input));
    expect(url.searchParams.get("agent_id")).toBe(ENVIRONMENT.agentId);
    expect(String(input)).not.toContain(ENVIRONMENT.apiKey);
    expect(new Headers(init?.headers).get("xi-api-key")).toBe(ENVIRONMENT.apiKey);

    const serialized = JSON.stringify(await response.json());
    expect(serialized).not.toContain(ENVIRONMENT.apiKey);
    expect(serialized).not.toContain(ENVIRONMENT.agentId);
  });

  it.each([422, 429, 500, 503])(
    "sanitizes provider status %s as 502",
    async (status) => {
      const providerBody = `provider-secret-body-${status}`;
      const response = await responseWith(request(), {
        fetcher: vi.fn(async () => new Response(providerBody, { status })),
      });
      expect(response.status).toBe(502);
      const serialized = JSON.stringify(await response.json());
      expect(serialized).toContain("VOICE_UNAVAILABLE");
      expect(serialized).not.toContain(providerBody);
    },
  );

  it.each([401, 403])(
    "maps provider credential status %s to sanitized configuration failure",
    async (status) => {
      const providerBody = `provider-secret-body-${status}`;
      const response = await responseWith(request(), {
        fetcher: vi.fn(async () => new Response(providerBody, { status })),
      });
      expect(response.status).toBe(503);
      const serialized = JSON.stringify(await response.json());
      expect(serialized).toContain("VOICE_NOT_CONFIGURED");
      expect(serialized).not.toContain(providerBody);
    },
  );

  it("maps provider timeout to 504", async () => {
    const response = await responseWith(request(), {
      timeoutMs: 1,
      fetcher: vi.fn(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      ),
    });
    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ error: { code: "VOICE_TIMEOUT" } });
  });

  it("rejects malformed provider JSON", async () => {
    const response = await responseWith(request(), {
      fetcher: vi.fn(async () => Response.json({ token: "missing-conversation-id" })),
    });
    expect(response.status).toBe(502);
  });

  it("rejects blank provider tokens and conversation IDs", async () => {
    const blankToken = await responseWith(request(), {
      fetcher: vi.fn(async () =>
        Response.json({ token: "   ", conversation_id: "conversation-id" }),
      ),
    });
    const blankConversation = await responseWith(request(), {
      fetcher: vi.fn(async () =>
        Response.json({ token: "provider-token", conversation_id: "   " }),
      ),
    });
    expect(blankToken.status).toBe(502);
    expect(blankConversation.status).toBe(502);
  });

  it("returns the token, conversation ID, and exact authored variables", async () => {
    const response = await responseWith(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      conversationToken: "provider-token",
      conversationId: "conversation-id",
      dynamicVariables: buildCaseVariables(CASE_01),
    });
    expect(body.dynamicVariables).toMatchObject({
      opening_line: CASE_01.caller.firstMessage,
      scenario_summary: CASE_01.caller.scenarioSummary,
    });
    expect(body.dynamicVariables).not.toHaveProperty("offer_summary");
  });

  it("marks every response non-cacheable", async () => {
    const responses = await Promise.all([
      responseWith(request()),
      responseWith(request("{")),
      responseWith(request(), { getEnvironment: () => null }),
    ]);
    responses.forEach((response) => {
      expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    });
  });

  it("emits only sanitized log fields", async () => {
    const logs: VoiceLogEvent[] = [];
    const providerBody = "private-provider-body";
    await responseWith(request(), {
      logger: (event) => logs.push(event),
      fetcher: vi.fn(async () => new Response(providerBody, { status: 401 })),
    });
    expect(logs).toEqual([
      {
        requestId: "request-id",
        caseId: "case-01",
        providerStatusClass: "4xx",
        elapsedMs: 0,
        internalCode: "VOICE_NOT_CONFIGURED",
      },
    ]);
    const serialized = JSON.stringify(logs);
    expect(serialized).not.toContain(ENVIRONMENT.apiKey);
    expect(serialized).not.toContain("provider-token");
    expect(serialized).not.toContain(providerBody);
    expect(serialized).not.toContain("transcript");
  });
});

describe("pressure-card payload validation", () => {
  it("accepts exactly one allowlisted tactic field", () => {
    expect(parsePressureToolPayload({ tactic: "urgency" })).toEqual({
      success: true,
      tactic: "urgency",
    });
  });

  it.each([
    [null],
    ["urgency"],
    [{ tactic: "fear" }],
    [{ tactic: "urgency", copy: "model supplied" }],
    [{}],
  ])("rejects malformed payload %j", (payload) => {
    expect(parsePressureToolPayload(payload)).toEqual({ success: false });
  });
});
