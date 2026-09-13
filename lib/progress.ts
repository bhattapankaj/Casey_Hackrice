export const PROGRESS_STORAGE_KEY = "casey_progress_v1";

export type CaseProgress = {
  attempts: number;
  bestScore: number;
  cleared: boolean;
  lastVerdict: string;
  usedOutOfBand: boolean;
  clearedAt: string | null;
  firstAttemptCorrect: boolean | null;
  pinnedArtifactIds: string[];
};

export type ProgressV1 = {
  version: 1;
  nickname: string | null;
  nicknameAsked: boolean;
  cases: Record<string, CaseProgress>;
};

export type CatalogStats = {
  casesCompleted: number;
  bestStreak: number;
  totalScore: number;
};

export type CaseResultInput = {
  caseId: string;
  verdict: string;
  score: number;
  correct: boolean;
  usedOutOfBand: boolean;
  pinnedArtifactIds?: string[];
  at: string;
};

export function emptyProgress(): ProgressV1 {
  return { version: 1, nickname: null, nicknameAsked: false, cases: {} };
}

export function parseProgress(raw: string | null): ProgressV1 {
  if (!raw) {
    return emptyProgress();
  }
  try {
    const value = JSON.parse(raw) as unknown;
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return emptyProgress();
    }
    const record = value as Record<string, unknown>;
    if (record.version !== 1) {
      return emptyProgress();
    }
    const cases: Record<string, CaseProgress> = {};
    if (record.cases && typeof record.cases === "object" && !Array.isArray(record.cases)) {
      for (const [caseId, entry] of Object.entries(record.cases as Record<string, unknown>)) {
        const parsed = parseCaseProgress(entry);
        if (parsed) {
          cases[caseId] = parsed;
        }
      }
    }
    return {
      version: 1,
      nickname: typeof record.nickname === "string" ? record.nickname : null,
      nicknameAsked: record.nicknameAsked === true || typeof record.nickname === "string",
      cases,
    };
  } catch {
    return emptyProgress();
  }
}

function parseCaseProgress(value: unknown): CaseProgress | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  if (typeof entry.attempts !== "number" || typeof entry.bestScore !== "number") {
    return null;
  }
  let firstAttemptCorrect: boolean | null = null;
  if (entry.firstAttemptCorrect === true || entry.firstAttemptCorrect === false) {
    firstAttemptCorrect = entry.firstAttemptCorrect;
  } else if (entry.attempts === 1) {
    firstAttemptCorrect = entry.cleared === true;
  }
  return {
    attempts: entry.attempts,
    bestScore: Math.max(0, entry.bestScore),
    cleared: entry.cleared === true,
    lastVerdict: typeof entry.lastVerdict === "string" ? entry.lastVerdict : "",
    usedOutOfBand: entry.usedOutOfBand === true,
    clearedAt: typeof entry.clearedAt === "string" ? entry.clearedAt : null,
    firstAttemptCorrect,
    pinnedArtifactIds: Array.isArray(entry.pinnedArtifactIds)
      ? entry.pinnedArtifactIds.filter((id): id is string => typeof id === "string")
      : [],
  };
}

export function recordCaseResult(progress: ProgressV1, result: CaseResultInput): ProgressV1 {
  const previous = progress.cases[result.caseId];
  const attempts = (previous?.attempts ?? 0) + 1;
  const firstAttemptCorrect =
    previous?.firstAttemptCorrect ?? (attempts === 1 ? result.correct : null);
  const cleared = (previous?.cleared ?? false) || result.correct;
  return {
    ...progress,
    cases: {
      ...progress.cases,
      [result.caseId]: {
        attempts,
        bestScore: Math.max(previous?.bestScore ?? 0, Math.max(0, result.score)),
        cleared,
        lastVerdict: result.verdict,
        usedOutOfBand: result.usedOutOfBand,
        clearedAt: result.correct ? result.at : (previous?.clearedAt ?? null),
        firstAttemptCorrect,
        pinnedArtifactIds: result.pinnedArtifactIds ?? previous?.pinnedArtifactIds ?? [],
      },
    },
  };
}

export function resetProgress(): ProgressV1 {
  return emptyProgress();
}

export function longestFirstAttemptStreak(
  progress: ProgressV1,
  caseOrder: readonly string[],
): number {
  let best = 0;
  let run = 0;
  for (const caseId of caseOrder) {
    if (progress.cases[caseId]?.firstAttemptCorrect) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

export function catalogStats(
  progress: ProgressV1,
  caseOrder: readonly string[] = Object.keys(progress.cases),
): CatalogStats {
  const entries = Object.values(progress.cases);
  return {
    casesCompleted: entries.filter((entry) => entry.cleared).length,
    bestStreak: longestFirstAttemptStreak(progress, caseOrder),
    totalScore: entries.reduce((total, entry) => total + Math.max(0, entry.bestScore), 0),
  };
}

export function caseStatus(
  progress: ProgressV1,
  caseId: string,
): "not_attempted" | "attempted" | "cleared" {
  const entry = progress.cases[caseId];
  if (!entry || entry.attempts === 0) {
    return "not_attempted";
  }
  return entry.cleared ? "cleared" : "attempted";
}

export function readStoredProgress(): ProgressV1 {
  if (typeof window === "undefined") {
    return emptyProgress();
  }
  try {
    return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY));
  } catch {
    return emptyProgress();
  }
}

export function writeStoredProgress(progress: ProgressV1): ProgressV1 {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Keep the in-memory result if storage is blocked.
  }
  return progress;
}

export function persistCaseResult(result: CaseResultInput): ProgressV1 {
  return writeStoredProgress(recordCaseResult(readStoredProgress(), result));
}

export function persistReset(): ProgressV1 {
  return writeStoredProgress(resetProgress());
}

export function persistNickname(nickname: string | null, asked = true): ProgressV1 {
  const current = readStoredProgress();
  return writeStoredProgress({
    ...current,
    nickname,
    nicknameAsked: asked,
  });
}
