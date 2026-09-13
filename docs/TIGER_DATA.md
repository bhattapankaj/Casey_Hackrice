# Casey — Tiger Data readiness runbook

Tiger Data is Casey's optional, server-only anonymous outcome analytics and shared
leaderboard layer. The browser remains the source of local play state for now, and
Case 01 must always work without a database.

## What is ready

- The official Tiger CLI and its Codex MCP can inspect Tiger Cloud and Postgres docs.
- `lib/db/**` contains a lazy server-only pool, a deterministic privacy-minimized row
  builder, and a parameterized insert adapter.
- `db/migrations/001_session_outcomes.sql` creates an idempotency table, a TimescaleDB
  hypertable, and an hourly continuous aggregate.
- `db/migrations/002_board_entries.sql` creates the optional scored-board table. That
  table is not analytics telemetry.
- `db/migrations/003_board_entry_idempotency.sql` upgrades earlier board tables with a
  collision-safe submission UUID and idempotent upsert support.
- `db/migrations/004_board_hand_chips.sql` stores the server-derived best hand and the
  bounded chip balance shown on the shared board.
- `/api/board` validates same-origin submissions, re-scores canonical case results on
  the server, and stores only the required board nickname plus score summary after a
  case has been completed.
- Shared rows display a memorable nickname-derived username while the full browser UUID
  remains the database identity.
- `db/queries/demo-dashboard.sql` contains judge-safe queries that keep the sample size
  beside every rate.
- Local progress still works when the shared store is missing or unreachable.

## Live verification record

On 2026-09-13, the reviewed migrations and `npm run db:verify` completed against the
selected Tiger Cloud service. A same-origin API smoke test then:

1. created a fictional board submission;
2. updated the same submission UUID from 75 to 150 points;
3. read back exactly one row with the expected nickname-derived username; and
4. removed the smoke-test row, leaving the live board clean.

This verifies the local Casey-to-Tiger leaderboard path. It does not verify a deployed
HTTPS environment, a public dashboard, or anonymous `session_outcomes` ingestion; those
remain release gates.

## Privacy contract

Tiger Data may receive only a completed, anonymous outcome produced from canonical Casey
state. It must never receive:

- the player name or leaderboard nickname in `session_outcomes`;
- audio, captions, or a transcript;
- IP address, user agent, or a persistent device identifier;
- artifact text, caller/model text, or arbitrary client metadata.

The allowed row contains a one-session UUID, case/mode/verdict, deterministic score
dimensions, evidence counts, independent-route signals, pressure-card count, and a
bounded completion duration. Time never affects the score.

## Local MCP setup

Install and authenticate using Tiger Data's official CLI:

```bash
brew install --cask timescale/tap/tiger-cli
tiger auth login
tiger config set read_only all
tiger mcp install codex
```

Restart Codex after installation, then verify:

```bash
codex mcp list
tiger auth status
```

Keep MCP read-only during design and inspection. Temporarily change it only when an
intentional migration or service-management task requires writes, then restore it:

```bash
tiger config set read_only false
# perform the reviewed write
tiger config set read_only all
```

Do not put a Tiger account token or database password in Codex configuration. Tiger MCP
uses the CLI login and local credential store.

## Setup and release

The local service and schema are ready. For another machine or deployment:

1. Select the existing Tiger Cloud service in the Tiger Console or authenticated CLI.
2. Put its PostgreSQL connection URL in the server environment as
   `TIGER_DATABASE_URL`; ensure
   it includes `sslmode=require`. Never use a `NEXT_PUBLIC_` prefix.
3. Run `npm run db:migrate` and `npm run db:verify`.
4. Keep localStorage as the fallback. A failed board write must never block the game or
   Receipt.
5. Only after the core demo remains green, add a strict completion route that rebuilds
   canonical state and calls `buildAnonymousSessionOutcome`.
6. Run `db/queries/demo-dashboard.sql` before presenting a live analytics view.

The board integration has a real insert/query record above. Do not describe anonymous
outcome ingestion, the deployed environment, or a dashboard as verified until those
separate gates are recorded.

## Commands

```bash
npm run db:migrate  # applies the idempotent schema using TIGER_DATABASE_URL
npm run db:verify   # read-only readiness check using TIGER_DATABASE_URL
```

Primary references: [Tiger CLI and MCP](https://github.com/timescale/tiger-cli),
[Tiger Data documentation](https://www.tigerdata.com/docs), and
[HackRice Tiger Data prize](https://www.mlh.com/events/hackrice-71/prizes).
