BEGIN;

CREATE TABLE IF NOT EXISTS casey.board_entries (
  id BIGSERIAL PRIMARY KEY,
  submission_id UUID NOT NULL,
  nickname TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 20),
  score INTEGER NOT NULL CHECK (score >= 0),
  cases_cleared SMALLINT NOT NULL CHECK (cases_cleared >= 0),
  cases_played SMALLINT NOT NULL CHECK (cases_played >= 0),
  case01_wrong BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS board_entries_submission_id_idx
  ON casey.board_entries (submission_id);

CREATE INDEX IF NOT EXISTS board_entries_score_idx
  ON casey.board_entries (score DESC, created_at ASC);

COMMIT;
