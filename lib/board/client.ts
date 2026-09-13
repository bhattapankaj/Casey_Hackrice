import { caseResultsFromProgress } from "@/lib/board/local";
import { parseSubmissionId, sanitizeNickname } from "@/lib/board/submission";
import type { BoardRow, BoardStats } from "@/lib/board/types";
import { persistNickname } from "@/lib/progress";

export const BOARD_SUBMISSION_ID_KEY = "casey_board_submission_id_v1";

export function getOrCreateBoardSubmissionId(): string {
  try {
    const existing = window.localStorage.getItem(BOARD_SUBMISSION_ID_KEY);
    const parsed = parseSubmissionId(existing);
    if (parsed) {
      return parsed;
    }
    const created = crypto.randomUUID();
    window.localStorage.setItem(BOARD_SUBMISSION_ID_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export async function postCurrentBoard(nickname: string): Promise<"shared" | "local"> {
  const clean = sanitizeNickname(nickname);
  if (!clean) {
    return "local";
  }
  const progress = persistNickname(clean);
  const caseResults = caseResultsFromProgress(progress);
  if (Object.keys(caseResults).length === 0) {
    return "local";
  }
  const submissionId = getOrCreateBoardSubmissionId();
  try {
    const response = await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, nickname: clean, caseResults }),
    });
    if (response.ok) {
      return "shared";
    }
  } catch {
    // Keep the local score. The board page explains the fallback.
  }
  return "local";
}

export async function fetchSharedBoard(): Promise<{
  unavailable: boolean;
  entries: BoardRow[];
  stats: BoardStats;
}> {
  try {
    const response = await fetch("/api/board", { cache: "no-store" });
    const body = (await response.json()) as {
      unavailable?: boolean;
      entries?: BoardRow[];
      stats?: BoardStats;
    };
    return {
      unavailable: Boolean(body.unavailable) || !response.ok,
      entries: Array.isArray(body.entries) ? body.entries : [],
      stats: body.stats ?? { playersTonight: 0, casesPlayed: 0, case01WrongPercent: null },
    };
  } catch {
    return {
      unavailable: true,
      entries: [],
      stats: { playersTonight: 0, casesPlayed: 0, case01WrongPercent: null },
    };
  }
}
