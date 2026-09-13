import {
  parseCaseResults,
  parseSubmissionId,
  sanitizeNickname,
  scoreBoardSubmission,
  sanitizeChips,
} from "@/lib/board/submission";
import { emptySnapshot, getBoardStore } from "@/lib/db/board.server";
import { createLocalRateLimiter } from "@/lib/voice/rate-limit.server";

export const dynamic = "force-dynamic";

const JSON_HEADERS = { "Cache-Control": "no-store, max-age=0" };
const boardRateLimiter = createLocalRateLimiter({ limit: 12, windowMs: 60_000 });

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: JSON_HEADERS });
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}

function requestKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function GET(): Promise<Response> {
  try {
    const store = getBoardStore();
    if (!store) {
      return json({ ok: true, unavailable: true, ...emptySnapshot() });
    }
    const snapshot = await store.read();
    return json({ ok: true, unavailable: false, ...snapshot });
  } catch {
    return json({ ok: true, unavailable: true, ...emptySnapshot() });
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return json({ ok: false, error: "Forbidden" }, 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ ok: false, error: "JSON required" }, 415);
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 16_384) {
    return json({ ok: false, error: "Submission too large" }, 413);
  }
  const limit = boardRateLimiter.consume(requestKey(request), Date.now());
  if (!limit.allowed) {
    return Response.json(
      { ok: false, error: "Too many submissions" },
      {
        status: 429,
        headers: { ...JSON_HEADERS, "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ ok: false, error: "Invalid body" }, 400);
  }

  const record = body as Record<string, unknown>;
  const submissionId = parseSubmissionId(record.submissionId);
  const nickname = sanitizeNickname(record.nickname);
  const caseResults = parseCaseResults(record.caseResults);
  if (!submissionId || !nickname || !caseResults) {
    return json({ ok: false, error: "Invalid submission" }, 400);
  }

  const scored = scoreBoardSubmission(
    nickname,
    caseResults,
    undefined,
    sanitizeChips(record.chips),
  );
  if ("error" in scored) {
    return json({ ok: false, error: scored.error }, 400);
  }

  try {
    const store = getBoardStore();
    if (!store) {
      return json({ ok: false, unavailable: true }, 503);
    }
    await store.write({ submissionId, ...scored });
    return json({
      ok: true,
      score: scored.score,
      casesCleared: scored.casesCleared,
      bestHand: scored.bestHand,
      chips: scored.chips,
    });
  } catch {
    return json({ ok: false, unavailable: true }, 503);
  }
}
