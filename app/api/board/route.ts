import { sanitizeNickname, parseCaseResults, scoreBoardSubmission } from "@/lib/board/submission";
import { emptySnapshot, getBoardStore } from "@/lib/db/board.server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const store = getBoardStore();
    if (!store) {
      return Response.json({ ok: true, unavailable: true, ...emptySnapshot() });
    }
    const snapshot = await store.read();
    return Response.json({ ok: true, unavailable: false, ...snapshot });
  } catch {
    return Response.json({ ok: true, unavailable: true, ...emptySnapshot() });
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const nickname = sanitizeNickname(record.nickname);
  const caseResults = parseCaseResults(record.caseResults);
  if (!nickname || !caseResults) {
    return Response.json({ ok: false, error: "Invalid submission" }, { status: 400 });
  }

  const scored = scoreBoardSubmission(nickname, caseResults);
  if ("error" in scored) {
    return Response.json({ ok: false, error: scored.error }, { status: 400 });
  }

  try {
    const store = getBoardStore();
    if (!store) {
      return Response.json({ ok: false, unavailable: true }, { status: 503 });
    }
    await store.write(scored);
    return Response.json({
      ok: true,
      score: scored.score,
      casesCleared: scored.casesCleared,
    });
  } catch {
    return Response.json({ ok: false, unavailable: true }, { status: 503 });
  }
}
