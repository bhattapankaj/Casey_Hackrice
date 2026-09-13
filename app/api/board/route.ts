import {
  parseCaseResults,
  parseSubmissionId,
  sanitizeNickname,
  scoreBoardSubmission,
} from "@/lib/board/submission";
import { emptySnapshot, getBoardStore } from "@/lib/db/board.server";

export const dynamic = "force-dynamic";

const JSON_HEADERS = { "Cache-Control": "no-store, max-age=0" };

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: JSON_HEADERS });
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
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

  const scored = scoreBoardSubmission(nickname, caseResults);
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
    });
  } catch {
    return json({ ok: false, unavailable: true }, 503);
  }
}
