import type { CaseFile } from "@/lib/cases/schema";
import type { GameSession } from "@/lib/engine/types";
import { scoreSession } from "@/lib/engine/score";

export const ANONYMOUS_OUTCOME_VERSION = 1 as const;

export type AnonymousSessionOutcome = {
  version: typeof ANONYMOUS_OUTCOME_VERSION;
  sessionId: string;
  occurredAt: string;
  caseId: string;
  mode: NonNullable<GameSession["mode"]>;
  selectedVerdict: NonNullable<GameSession["verdict"]>;
  truth: CaseFile["truth"];
  verdictCorrect: boolean;
  totalScore: number;
  verdictScore: number;
  independenceScore: number;
  evidenceQualityScore: number;
  composureScore: number;
  evidenceCount: number;
  independentRouteUsed: boolean;
  independentEvidencePinned: boolean;
  pressureCardCount: number;
  durationSeconds: number | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function normalizeTimestamp(value: string, label: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`${label} must be a valid timestamp`);
  }
  return timestamp.toISOString();
}

function durationSeconds(startedAt: string, committedAt: string): number | null {
  const duration = Math.round(
    (Date.parse(committedAt) - Date.parse(startedAt)) / 1_000,
  );
  return duration >= 0 && duration <= 3_600 ? duration : null;
}

/**
 * Builds the only row Casey may persist. It derives scores and learning signals from
 * canonical case/session state and deliberately has no player-name or transcript input.
 */
export function buildAnonymousSessionOutcome(input: {
  caseFile: CaseFile;
  session: GameSession;
  sessionId: string;
  occurredAt: string;
}): AnonymousSessionOutcome {
  const { caseFile, session, sessionId } = input;
  if (!UUID_PATTERN.test(sessionId)) {
    throw new Error("sessionId must be a UUID");
  }
  if (session.caseId !== caseFile.id) {
    throw new Error("Session and case IDs do not match");
  }
  if (!session.mode || !session.verdict || !session.timestamps.committedAt) {
    throw new Error("Only completed sessions can produce an outcome");
  }

  const occurredAt = normalizeTimestamp(input.occurredAt, "occurredAt");
  const committedAt = normalizeTimestamp(
    session.timestamps.committedAt,
    "committedAt",
  );
  const startedAt = normalizeTimestamp(session.timestamps.startedAt, "startedAt");
  const score = scoreSession(caseFile, session);
  const artifactById = new Map(
    caseFile.artifacts.map((artifact) => [artifact.id, artifact]),
  );
  const actionById = new Map(caseFile.actions.map((action) => [action.id, action]));

  return {
    version: ANONYMOUS_OUTCOME_VERSION,
    sessionId: sessionId.toLowerCase(),
    occurredAt,
    caseId: caseFile.id,
    mode: session.mode,
    selectedVerdict: session.verdict,
    truth: caseFile.truth,
    verdictCorrect: session.verdict === caseFile.truth,
    totalScore: score.total,
    verdictScore: score.verdict.earned,
    independenceScore: score.independence.earned,
    evidenceQualityScore: score.evidenceQuality.earned,
    composureScore: score.composure.earned,
    evidenceCount: session.pinnedArtifactIds.length,
    independentRouteUsed: session.actionIds.some(
      (id) => actionById.get(id)?.sourceClass === "independent",
    ),
    independentEvidencePinned: session.pinnedArtifactIds.some(
      (id) => artifactById.get(id)?.sourceClass === "independent",
    ),
    pressureCardCount: session.pressureTactics.length,
    durationSeconds: durationSeconds(startedAt, committedAt),
  };
}
