BEGIN;

ALTER TABLE casey.board_entries
  ADD COLUMN IF NOT EXISTS submission_id UUID;

ALTER TABLE casey.board_entries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill any rows created by the pre-idempotency leaderboard migration. The value is
-- deterministic per row and contains no player or browser identity.
UPDATE casey.board_entries
SET submission_id = md5('casey-board:' || id::text || ':' || created_at::text)::uuid
WHERE submission_id IS NULL;

ALTER TABLE casey.board_entries
  ALTER COLUMN submission_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS board_entries_submission_id_idx
  ON casey.board_entries (submission_id);

COMMIT;
