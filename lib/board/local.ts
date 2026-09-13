import type { BoardPayload, BoardRow, BoardStats } from "@/lib/board/types";
import { catalogStats, type ProgressV1 } from "@/lib/progress";
import { CASE_ORDER } from "@/lib/cases/registry";
import { boardUsername } from "@/lib/board/identity";

export const LOCAL_BOARD_KEY = "casey_board_local_v1";

export function caseResultsFromProgress(progress: ProgressV1) {
  const results: Record<string, { verdict: string; pinnedArtifactIds: string[] }> = {};
  for (const [caseId, entry] of Object.entries(progress.cases)) {
    const verdict = entry.bestVerdict || entry.lastVerdict;
    if (!verdict) {
      continue;
    }
    results[caseId] = {
      verdict,
      pinnedArtifactIds: entry.bestPinnedArtifactIds ?? entry.pinnedArtifactIds ?? [],
    };
  }
  return results;
}

export function localRowFromProgress(
  progress: ProgressV1,
  submissionId = "local-you",
): BoardRow | null {
  const played = Object.values(progress.cases).filter((entry) => entry.attempts > 0);
  if (played.length === 0) {
    return null;
  }
  const stats = catalogStats(progress, CASE_ORDER);
  return {
    id: submissionId,
    nickname: progress.nickname ?? "Anonymous",
    username: boardUsername(progress.nickname ?? "Anonymous", submissionId),
    score: stats.totalScore,
    casesCleared: stats.casesCompleted,
    createdAt: new Date().toISOString(),
    you: true,
  };
}

export function localStatsFromProgress(progress: ProgressV1): BoardStats {
  const played = Object.values(progress.cases).filter((entry) => entry.attempts > 0);
  const case01 = progress.cases["case-01"];
  return {
    playersTonight: played.length > 0 ? 1 : 0,
    casesPlayed: played.length,
    case01WrongPercent:
      !case01 || case01.attempts === 0
        ? null
        : case01.firstAttemptCorrect
          ? 0
          : 100,
  };
}

export function localBoardPayload(
  progress: ProgressV1,
  submissionId = "local-you",
): BoardPayload {
  const you = localRowFromProgress(progress, submissionId);
  return {
    source: "local",
    entries: you ? [you] : [],
    stats: localStatsFromProgress(progress),
  };
}
