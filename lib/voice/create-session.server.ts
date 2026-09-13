import { getCase } from "@/lib/cases/registry";
import { buildCaseVariables } from "@/lib/voice/case-variables";
import {
  requestConversationToken,
  VoiceProviderError,
  type ProviderFetcher,
} from "@/lib/voice/elevenlabs.server";
import type { RateLimiter } from "@/lib/voice/rate-limit.server";
import type {
  VoiceEnvironment,
  VoiceErrorCode,
  VoiceErrorResponse,
  VoiceLogEvent,
  VoiceSessionSuccess,
} from "@/lib/voice/types";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

type Dependencies = {
  getEnvironment: () => VoiceEnvironment | null;
  limiter: RateLimiter;
  fetcher?: ProviderFetcher;
  now?: () => number;
  createRequestId?: () => string;
  logger?: (event: VoiceLogEvent) => void;
  timeoutMs?: number;
};

function json(body: VoiceSessionSuccess | VoiceErrorResponse, status: number, extraHeaders?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, ...extraHeaders },
  });
}

function errorResponse(
  code: VoiceErrorCode,
  status: number,
  requestId: string,
  extraHeaders?: HeadersInit,
) {
  const messages: Record<VoiceErrorCode, string> = {
    INVALID_REQUEST: "The voice-session request was invalid.",
    UNKNOWN_CASE: "This case is not available for voice play.",
    FORBIDDEN: "This request origin is not allowed.",
    VOICE_NOT_CONFIGURED: "Live voice is not configured. Continue without microphone.",
    RATE_LIMITED: "Too many live-call requests. Continue without microphone or try later.",
    VOICE_UNAVAILABLE: "Live voice is unavailable. Continue without microphone.",
    VOICE_TIMEOUT: "Live voice took too long to respond. Continue without microphone.",
  };
  return json({ error: { code, message: messages[code], requestId } }, status, extraHeaders);
}

function requestKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}

function isExactRequestBody(value: unknown): value is { caseId: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value);
  return (
    entries.length === 1 &&
    entries[0][0] === "caseId" &&
    typeof entries[0][1] === "string" &&
    entries[0][1].length > 0
  );
}

export async function createVoiceSessionResponse(
  request: Request,
  dependencies: Dependencies,
): Promise<Response> {
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  const requestId = dependencies.createRequestId?.() ?? crypto.randomUUID();
  const logContext: { caseId?: string } = {};

  const finish = (
    response: Response,
    internalCode: VoiceLogEvent["internalCode"],
    providerStatusClass?: string,
  ) => {
    dependencies.logger?.({
      requestId,
      caseId: logContext.caseId,
      providerStatusClass,
      elapsedMs: Math.max(0, now() - startedAt),
      internalCode,
    });
    return response;
  };

  if (!isSameOrigin(request)) {
    return finish(errorResponse("FORBIDDEN", 403, requestId), "FORBIDDEN");
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return finish(errorResponse("INVALID_REQUEST", 400, requestId), "INVALID_REQUEST");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return finish(errorResponse("INVALID_REQUEST", 400, requestId), "INVALID_REQUEST");
  }
  if (!isExactRequestBody(body)) {
    return finish(errorResponse("INVALID_REQUEST", 400, requestId), "INVALID_REQUEST");
  }
  const caseId = body.caseId;
  logContext.caseId = caseId;
  const caseFile = getCase(caseId);
  if (!caseFile?.caller) {
    return finish(errorResponse("UNKNOWN_CASE", 400, requestId), "UNKNOWN_CASE");
  }

  const limit = dependencies.limiter.consume(requestKey(request), now());
  if (!limit.allowed) {
    return finish(
      errorResponse("RATE_LIMITED", 429, requestId, {
        "Retry-After": String(limit.retryAfterSeconds),
      }),
      "RATE_LIMITED",
    );
  }

  const environment = dependencies.getEnvironment();
  if (!environment) {
    return finish(
      errorResponse("VOICE_NOT_CONFIGURED", 503, requestId),
      "VOICE_NOT_CONFIGURED",
    );
  }

  try {
    const provider = await requestConversationToken(environment, {
      fetcher: dependencies.fetcher,
      timeoutMs: dependencies.timeoutMs,
    });
    return finish(
      json(
        {
          conversationToken: provider.token,
          conversationId: provider.conversationId,
          dynamicVariables: buildCaseVariables(caseFile),
        },
        200,
      ),
      "VOICE_SESSION_CREATED",
    );
  } catch (error) {
    const providerError =
      error instanceof VoiceProviderError ? error : new VoiceProviderError("unavailable");
    const code = providerError.kind === "timeout" ? "VOICE_TIMEOUT" : "VOICE_UNAVAILABLE";
    return finish(
      errorResponse(code, providerError.kind === "timeout" ? 504 : 502, requestId),
      code,
      providerError.providerStatusClass,
    );
  }
}
