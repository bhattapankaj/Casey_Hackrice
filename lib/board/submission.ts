import { getCase } from "@/lib/cases/registry";
import type { CaseFile, Verdict } from "@/lib/cases/schema";
import { VERDICTS } from "@/lib/cases/schema";
import { scoreCatalogRound } from "@/lib/engine/catalog-score";
import type { GameSession } from "@/lib/engine/types";

export type CaseResultPayload = {
  verdict: Verdict;
  pinnedArtifactIds: string[];
};

export type ScoredSubmission = {
  nickname: string;
  score: number;
  casesCleared: number;
  casesPlayed: number;
  case01Wrong: boolean | null;
};

const NICKNAME_MAX = 20;

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
    const pinnedArtifactIds = record.pinnedArtifactIds.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
    results[caseId] = { verdict: record.verdict, pinnedArtifactIds };
  }
  return results;
}

export function scoreBoardSubmission(
  nickname: string,
  caseResults: Record<string, CaseResultPayload>,
  lookup: (caseId: string) => CaseFile | undefined = getCase,
): ScoredSubmission | { error: string } {
  let score = 0;
  let casesCleared = 0;
  let casesPlayed = 0;
  let case01Wrong: boolean | null = null;

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

  return { nickname, score, casesCleared, casesPlayed, case01Wrong };
}
