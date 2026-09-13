import type { BoardPayload, BoardRow, BoardStats } from "@/lib/board/types";
import { catalogStats, type ProgressV1 } from "@/lib/progress";
import { CASE_ORDER } from "@/lib/cases/registry";

export const LOCAL_BOARD_KEY = "casey_board_local_v1";

export function caseResultsFromProgress(progress: ProgressV1) {
  const results: Record<string, { verdict: string; pinnedArtifactIds: string[] }> = {};
  for (const [caseId, entry] of Object.entries(progress.cases)) {
    if (!entry.lastVerdict) {
      continue;
    }
    results[caseId] = {
      verdict: entry.lastVerdict,
      pinnedArtifactIds: entry.pinnedArtifactIds ?? [],
    };
  }
  return results;
}

export function localRowFromProgress(progress: ProgressV1): BoardRow | null {
  const played = Object.values(progress.cases).filter((entry) => entry.attempts > 0);
  if (played.length === 0) {
    return null;
  }
  const stats = catalogStats(progress, CASE_ORDER);
  return {
    id: "local-you",
    nickname: progress.nickname ?? "Anonymous",
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
    casesPlayed: played.reduce((total, entry) => total + entry.attempts, 0),
    case01WrongPercent:
      !case01 || case01.attempts === 0
        ? null
        : case01.firstAttemptCorrect
          ? 0
          : 100,
  };
}

export function localBoardPayload(progress: ProgressV1): BoardPayload {
  const you = localRowFromProgress(progress);
  return {
    source: "local",
    entries: you ? [you] : [],
    stats: localStatsFromProgress(progress),
  };
}
