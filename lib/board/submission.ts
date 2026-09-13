import { getCase } from "@/lib/cases/registry";
import type { CaseFile, Verdict } from "@/lib/cases/schema";
import { VERDICTS } from "@/lib/cases/schema";
import { scoreCatalogRound } from "@/lib/engine/catalog-score";
import { isBetterHand, type Hand } from "@/lib/engine/hand";
import { handForRound } from "@/lib/engine/hand-from-session";
import type { GameSession } from "@/lib/engine/types";
import { STARTING_CHIPS } from "@/lib/engine/chips";

export type CaseResultPayload = {
  verdict: Verdict;
  pinnedArtifactIds: string[];
  firstAttempt?: boolean;
};

export type ScoredSubmission = {
  nickname: string;
  score: number;
  casesCleared: number;
  casesPlayed: number;
  case01Wrong: boolean | null;
  bestHand: Hand;
  chips: number;
};

const NICKNAME_MAX = 20;
const SUBMISSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function parseSubmissionId(value: unknown): string | null {
  return typeof value === "string" && SUBMISSION_ID_PATTERN.test(value)
    ? value.toLowerCase()
    : null;
}

export function sanitizeNickname(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const cleaned = value.replace(/[^A-Za-z0-9 _-]/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return null;
  }
  return Array.from(cleaned).slice(0, NICKNAME_MAX).join("");
}

function isVerdict(value: unknown): value is Verdict {
  return typeof value === "string" && (VERDICTS as readonly string[]).includes(value);
}

export function parseCaseResults(value: unknown): Record<string, CaseResultPayload> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const results: Record<string, CaseResultPayload> = {};
  for (const [caseId, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return null;
    }
    const record = entry as Record<string, unknown>;
    if (!isVerdict(record.verdict) || !Array.isArray(record.pinnedArtifactIds)) {
      return null;
    }
    if (
      record.pinnedArtifactIds.length > 3 ||
      record.pinnedArtifactIds.some(
        (id) => typeof id !== "string" || id.length === 0 || id.length > 80,
      )
    ) {
      return null;
    }
    const pinnedArtifactIds = record.pinnedArtifactIds as string[];
    if (new Set(pinnedArtifactIds).size !== pinnedArtifactIds.length) {
      return null;
    }
    results[caseId] = {
      verdict: record.verdict,
      pinnedArtifactIds,
      firstAttempt: record.firstAttempt === true,
    };
  }
  return results;
}

export function sanitizeChips(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return STARTING_CHIPS;
  }
  return Math.max(0, Math.min(99_999, Math.floor(value)));
}

export function scoreBoardSubmission(
  nickname: string,
  caseResults: Record<string, CaseResultPayload>,
  lookup: (caseId: string) => CaseFile | undefined = getCase,
  chips: number = STARTING_CHIPS,
): ScoredSubmission | { error: string } {
  let score = 0;
  let casesCleared = 0;
  let casesPlayed = 0;
  let case01Wrong: boolean | null = null;
  let bestHand: Hand = "High card";

  for (const [caseId, result] of Object.entries(caseResults)) {
    const caseFile = lookup(caseId);
    if (!caseFile) {
      return { error: "Unknown case" };
    }
    const knownIds = new Set(caseFile.artifacts.map((artifact) => artifact.id));
    if (result.pinnedArtifactIds.some((id) => !knownIds.has(id))) {
      return { error: "Unknown pinned artifact" };
    }
    const session: GameSession = {
      caseId,
      mode: null,
      revealedArtifactIds: [
        ...new Set([...caseFile.startingArtifactIds, ...result.pinnedArtifactIds]),
      ],
      actionIds: [],
      pinnedArtifactIds: result.pinnedArtifactIds.slice(0, 3),
      pressureTactics: [],
      verdict: result.verdict,
      timestamps: { startedAt: "" },
    };
    const round = scoreCatalogRound(caseFile, session);
    const ranked = handForRound(
      caseFile,
      session,
      round.correct,
      result.firstAttempt === true,
    );
    if (isBetterHand(ranked.hand, bestHand)) {
      bestHand = ranked.hand;
    }
    score += round.total;
    casesPlayed += 1;
    if (round.correct) {
      casesCleared += 1;
    }
    if (caseId === "case-01") {
      case01Wrong = !round.correct;
    }
  }

  if (casesPlayed === 0) {
    return { error: "No case results" };
  }

  return {
    nickname,
    score,
    casesCleared,
    casesPlayed,
    case01Wrong,
    bestHand,
    chips: sanitizeChips(chips),
  };
}
