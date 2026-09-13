import { isBetterHand, type Hand, HANDS } from "@/lib/engine/hand";
import {
  resolveStake,
  STARTING_CHIPS,
  TABLE_RESERVE_CHIPS,
  type Stake,
} from "@/lib/engine/chips";

export const PROGRESS_STORAGE_KEY = "casey_progress_v1";

export type CaseProgress = {
  attempts: number;
  bestScore: number;
  bestVerdict: string;
  bestPinnedArtifactIds: string[];
  cleared: boolean;
  lastVerdict: string;
  usedOutOfBand: boolean;
  clearedAt: string | null;
  firstAttemptCorrect: boolean | null;
  pinnedArtifactIds: string[];
  bestHand: Hand | null;
  lastHand: Hand | null;
  lastStake: Stake | null;
};

export type ProgressV1 = {
  version: 1;
  nickname: string | null;
  nicknameAsked: boolean;
  chips: number;
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
  hand: Hand;
  stake: Stake;
  at: string;
};

export type PreparedCaseRun = {
  caseId: string;
  mode: "ranked" | "practice";
  progress: ProgressV1;
  reserveGranted: boolean;
};

function parseHand(value: unknown): Hand | null {
  return typeof value === "string" && (HANDS as readonly string[]).includes(value)
    ? (value as Hand)
    : null;
}

export function emptyProgress(): ProgressV1 {
  return {
    version: 1,
    nickname: null,
    nicknameAsked: false,
    chips: STARTING_CHIPS,
    cases: {},
  };
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
    const chips =
      typeof record.chips === "number" && Number.isFinite(record.chips)
        ? Math.max(0, Math.floor(record.chips))
        : STARTING_CHIPS;
    return {
      version: 1,
      nickname: typeof record.nickname === "string" ? record.nickname : null,
      nicknameAsked: record.nicknameAsked === true || typeof record.nickname === "string",
      chips,
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
  const lastStake =
    entry.lastStake === 10 || entry.lastStake === 25 || entry.lastStake === 50
      ? entry.lastStake
      : null;
  return {
    attempts: entry.attempts,
    bestScore: Math.max(0, entry.bestScore),
    bestVerdict:
      typeof entry.bestVerdict === "string"
        ? entry.bestVerdict
        : typeof entry.lastVerdict === "string"
          ? entry.lastVerdict
          : "",
    bestPinnedArtifactIds: Array.isArray(entry.bestPinnedArtifactIds)
      ? entry.bestPinnedArtifactIds.filter((id): id is string => typeof id === "string")
      : Array.isArray(entry.pinnedArtifactIds)
        ? entry.pinnedArtifactIds.filter((id): id is string => typeof id === "string")
        : [],
    cleared: entry.cleared === true,
    lastVerdict: typeof entry.lastVerdict === "string" ? entry.lastVerdict : "",
    usedOutOfBand: entry.usedOutOfBand === true,
    clearedAt: typeof entry.clearedAt === "string" ? entry.clearedAt : null,
    firstAttemptCorrect,
    pinnedArtifactIds: Array.isArray(entry.pinnedArtifactIds)
      ? entry.pinnedArtifactIds.filter((id): id is string => typeof id === "string")
      : [],
    bestHand: parseHand(entry.bestHand),
    lastHand: parseHand(entry.lastHand),
    lastStake,
  };
}

export function recordCaseResult(progress: ProgressV1, result: CaseResultInput): ProgressV1 {
  const previous = progress.cases[result.caseId];
  if (previous && previous.attempts > 0) {
    return progress;
  }

  const nextChips = resolveStake(progress.chips, result.stake, result.correct);
  return {
    ...progress,
    chips: nextChips,
    cases: {
      ...progress.cases,
      [result.caseId]: {
        attempts: 1,
        bestScore: Math.max(0, result.score),
        bestVerdict: result.verdict,
        bestPinnedArtifactIds: result.pinnedArtifactIds ?? [],
        cleared: result.correct,
        lastVerdict: result.verdict,
        usedOutOfBand: result.usedOutOfBand,
        clearedAt: result.correct ? result.at : null,
        firstAttemptCorrect: result.correct,
        pinnedArtifactIds: result.pinnedArtifactIds ?? [],
        bestHand: result.hand,
        lastHand: result.hand,
        lastStake: result.stake,
      },
    },
  };
}

export function isRankedCaseSettled(progress: ProgressV1, caseId: string): boolean {
  return (progress.cases[caseId]?.attempts ?? 0) > 0;
}

export function prepareCaseRun(progress: ProgressV1, caseId: string): PreparedCaseRun {
  if (isRankedCaseSettled(progress, caseId)) {
    return { caseId, mode: "practice", progress, reserveGranted: false };
  }
  if (progress.chips >= TABLE_RESERVE_CHIPS) {
    return { caseId, mode: "ranked", progress, reserveGranted: false };
  }
  return {
    caseId,
    mode: "ranked",
    progress: { ...progress, chips: TABLE_RESERVE_CHIPS },
    reserveGranted: true,
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

export function bestHandAcross(progress: ProgressV1): Hand | null {
  let best: Hand | null = null;
  for (const entry of Object.values(progress.cases)) {
    if (entry.bestHand && isBetterHand(entry.bestHand, best)) {
      best = entry.bestHand;
    }
  }
  return best;
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
    window.dispatchEvent(new Event("casey-progress"));
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
