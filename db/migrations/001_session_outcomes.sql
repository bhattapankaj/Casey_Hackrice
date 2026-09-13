BEGIN;

CREATE SCHEMA IF NOT EXISTS casey;

-- TimescaleDB unique constraints must include the partitioning column. This small
-- relational table gives the insert adapter one global, transaction-safe idempotency key.
CREATE TABLE IF NOT EXISTS casey.outcome_submissions (
  session_id UUID PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS casey.session_outcomes (
  session_id UUID NOT NULL,
  schema_version SMALLINT NOT NULL CHECK (schema_version = 1),
  occurred_at TIMESTAMPTZ NOT NULL,
  case_id TEXT NOT NULL CHECK (case_id ~ '^case-[0-9]{2}$'),
  mode TEXT NOT NULL CHECK (
    mode IN ('live_voice', 'text_fallback', 'recorded_fallback')
  ),
  selected_verdict TEXT NOT NULL CHECK (
    selected_verdict IN ('scam', 'legit', 'not_enough_evidence')
  ),
  truth TEXT NOT NULL CHECK (
    truth IN ('scam', 'legit', 'not_enough_evidence')
  ),
  total_score SMALLINT NOT NULL CHECK (total_score BETWEEN 0 AND 1000),
  verdict_score SMALLINT NOT NULL CHECK (verdict_score BETWEEN 0 AND 400),
  independence_score SMALLINT NOT NULL CHECK (independence_score BETWEEN 0 AND 300),
  evidence_quality_score SMALLINT NOT NULL CHECK (evidence_quality_score BETWEEN 0 AND 200),
  composure_score SMALLINT NOT NULL CHECK (composure_score BETWEEN 0 AND 100),
  evidence_count SMALLINT NOT NULL CHECK (evidence_count BETWEEN 0 AND 3),
  independent_route_used BOOLEAN NOT NULL,
  independent_evidence_pinned BOOLEAN NOT NULL,
  pressure_card_count SMALLINT NOT NULL CHECK (pressure_card_count BETWEEN 0 AND 3),
  duration_seconds SMALLINT CHECK (duration_seconds BETWEEN 0 AND 3600),
  PRIMARY KEY (occurred_at, session_id),
  CHECK (
    total_score = verdict_score + independence_score + evidence_quality_score + composure_score
  )
);

SELECT create_hypertable(
  'casey.session_outcomes',
  by_range('occurred_at', INTERVAL '1 day'),
  if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS session_outcomes_case_time_idx
  ON casey.session_outcomes (case_id, occurred_at DESC);

CREATE MATERIALIZED VIEW IF NOT EXISTS casey.outcomes_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket(INTERVAL '1 hour', occurred_at) AS bucket,
  case_id,
  mode,
  COUNT(*) AS completed_sessions,
  COUNT(*) FILTER (WHERE selected_verdict = truth) AS correct_verdicts,
  COUNT(*) FILTER (WHERE independent_route_used) AS independent_routes,
  COUNT(*) FILTER (WHERE independent_evidence_pinned) AS independent_pins,
  AVG(total_score)::NUMERIC(7, 2) AS average_score,
  AVG(duration_seconds)::NUMERIC(10, 2) AS average_duration_seconds
FROM casey.session_outcomes
GROUP BY bucket, case_id, mode
WITH NO DATA;

COMMENT ON TABLE casey.session_outcomes IS
  'Privacy-minimized Casey outcomes: no names, audio, transcripts, IPs, or evidence content.';
COMMENT ON TABLE casey.outcome_submissions IS
  'Server-generated one-session UUIDs used only to reject duplicate outcome writes.';
COMMENT ON MATERIALIZED VIEW casey.outcomes_hourly IS
  'Hourly anonymous learning and reliability signals for the Casey demo.';

COMMIT;
