-- Overall learning signals. Always show the sample size beside percentages.
SELECT
  COUNT(*) AS completed_sessions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE selected_verdict = truth) / NULLIF(COUNT(*), 0), 1)
    AS correct_verdict_percent,
  ROUND(100.0 * COUNT(*) FILTER (WHERE independent_route_used) / NULLIF(COUNT(*), 0), 1)
    AS independent_route_percent,
  ROUND(100.0 * COUNT(*) FILTER (WHERE independent_evidence_pinned) / NULLIF(COUNT(*), 0), 1)
    AS independent_pin_percent,
  ROUND(AVG(total_score), 1) AS average_score
FROM casey.session_outcomes;

-- Confirm that live voice and fallback both preserve completion.
SELECT
  mode,
  COUNT(*) AS completed_sessions,
  ROUND(AVG(total_score), 1) AS average_score,
  ROUND(AVG(duration_seconds), 1) AS average_duration_seconds
FROM casey.session_outcomes
GROUP BY mode
ORDER BY mode;

-- Refresh before a live dashboard read when no refresh policy has been added yet.
CALL refresh_continuous_aggregate(
  'casey.outcomes_hourly',
  NOW() - INTERVAL '7 days',
  NOW()
);

SELECT *
FROM casey.outcomes_hourly
WHERE bucket >= NOW() - INTERVAL '24 hours'
ORDER BY bucket DESC, case_id, mode;
