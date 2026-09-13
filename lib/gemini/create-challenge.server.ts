import { getCase } from "@/lib/cases/registry";
import { buildMoriartyPlan } from "@/lib/engine/moriarty";
import {
  fallbackMoriartyResponse,
  parseMoriartyCopy,
  type MoriartyCopyResponse,
} from "@/lib/gemini/challenge";
import type { GeminiCopyGenerator, GeminiEnvironment } from "@/lib/gemini/types";
import type { RateLimiter } from "@/lib/voice/rate-limit.server";

const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

type Dependencies = {
  getEnvironment: () => GeminiEnvironment | null;
  generate: GeminiCopyGenerator;
  limiter: RateLimiter;
  now?: () => number;
  timeoutMs?: number;
};

type ChallengeRequest = {
  caseId: string;
  pinnedArtifactIds: string[];
};

function response(body: MoriartyCopyResponse, status = 200, headers?: HeadersInit) {
  return Response.json(body, { status, headers: { ...HEADERS, ...headers } });
}

function error(code: string, message: string, status: number, headers?: HeadersInit) {
  return Response.json(
    { error: { code, message } },
    { status, headers: { ...HEADERS, ...headers } },
  );
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}

function requestKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function parseRequest(value: unknown): ChallengeRequest | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    Object.keys(candidate).length !== 2 ||
    typeof candidate.caseId !== "string" ||
    candidate.caseId.length < 1 ||
    candidate.caseId.length > 80 ||
    !Array.isArray(candidate.pinnedArtifactIds) ||
    candidate.pinnedArtifactIds.length > 3 ||
    candidate.pinnedArtifactIds.some(
      (artifactId) => typeof artifactId !== "string" || artifactId.length < 1 || artifactId.length > 100,
    ) ||
    new Set(candidate.pinnedArtifactIds).size !== candidate.pinnedArtifactIds.length
  ) {
    return null;
  }
  return candidate as ChallengeRequest;
}

export async function createMoriartyChallengeResponse(
  request: Request,
  dependencies: Dependencies,
): Promise<Response> {
  if (!isSameOrigin(request)) {
    return error("FORBIDDEN", "This request origin is not allowed.", 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return error("INVALID_REQUEST", "The challenge request was invalid.", 400);
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return error("INVALID_REQUEST", "The challenge request was invalid.", 400);
  }
  const body = parseRequest(requestBody);
  if (!body) {
    return error("INVALID_REQUEST", "The challenge request was invalid.", 400);
  }

  const caseFile = getCase(body.caseId);
  if (!caseFile) {
    return error("UNKNOWN_CASE", "This case is not available for cross-examination.", 400);
  }

  let plan;
  try {
    plan = buildMoriartyPlan(caseFile, body.pinnedArtifactIds);
  } catch {
    return error("INVALID_REQUEST", "The challenge request was invalid.", 400);
  }

  const limit = dependencies.limiter.consume(requestKey(request), (dependencies.now ?? Date.now)());
  if (!limit.allowed) {
    return error(
      "RATE_LIMITED",
      "Moriarty has raised enough objections for now.",
      429,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  let environment: GeminiEnvironment | null;
  try {
    environment = dependencies.getEnvironment();
  } catch {
    environment = null;
  }
  if (!environment) {
    return response(fallbackMoriartyResponse(plan));
  }

  try {
    const generated = await dependencies.generate(plan, environment, dependencies.timeoutMs);
    const copy = parseMoriartyCopy(generated);
    return response(copy ? { source: "gemini", copy } : fallbackMoriartyResponse(plan));
  } catch {
    return response(fallbackMoriartyResponse(plan));
  }
}
