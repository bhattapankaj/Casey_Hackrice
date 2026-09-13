import "server-only";
import { getTigerPool } from "@/lib/db/pool.server";
import type { AnonymousSessionOutcome } from "@/lib/db/session-outcome";

export type OutcomeQueryResult = { rowCount: number | null };

export type OutcomeSqlExecutor = {
  query: (text: string, values: unknown[]) => Promise<OutcomeQueryResult>;
};

const INSERT_OUTCOME_SQL = `
  WITH accepted AS (
    INSERT INTO casey.outcome_submissions (session_id)
    VALUES ($1)
    ON CONFLICT (session_id) DO NOTHING
    RETURNING session_id
  )
  INSERT INTO casey.session_outcomes (
    session_id,
    schema_version,
    occurred_at,
    case_id,
    mode,
    selected_verdict,
    truth,
    total_score,
    verdict_score,
    independence_score,
    evidence_quality_score,
    composure_score,
    evidence_count,
    independent_route_used,
    independent_evidence_pinned,
    pressure_card_count,
    duration_seconds
  ) SELECT
    $1, $2, $3, $4, $5, $6, $7, $8, $9,
    $10, $11, $12, $13, $14, $15, $16, $17
  FROM accepted
`;

function defaultExecutor(): OutcomeSqlExecutor {
  return {
    query: (text, values) => getTigerPool().query(text, values),
  };
}

/** Parameterized and server-only; callers must pass a canonically built outcome. */
export async function insertAnonymousSessionOutcome(
  outcome: AnonymousSessionOutcome,
  executor: OutcomeSqlExecutor = defaultExecutor(),
): Promise<boolean> {
  const result = await executor.query(INSERT_OUTCOME_SQL, [
    outcome.sessionId,
    outcome.version,
    outcome.occurredAt,
    outcome.caseId,
    outcome.mode,
    outcome.selectedVerdict,
    outcome.truth,
    outcome.totalScore,
    outcome.verdictScore,
    outcome.independenceScore,
    outcome.evidenceQualityScore,
    outcome.composureScore,
    outcome.evidenceCount,
    outcome.independentRouteUsed,
    outcome.independentEvidencePinned,
    outcome.pressureCardCount,
    outcome.durationSeconds,
  ]);
  return result.rowCount === 1;
}
