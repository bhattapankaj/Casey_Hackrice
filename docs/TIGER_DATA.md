# Casey — Tiger Data readiness runbook

Tiger Data is Casey's optional, server-only anonymous outcome analytics layer. The
browser remains the source of local play state for now, and Case 01 must always work
without a database.

## What is ready

- The official Tiger CLI and its Codex MCP can inspect Tiger Cloud and Postgres docs.
- `lib/db/**` contains a lazy server-only pool, a deterministic privacy-minimized row
  builder, and a parameterized insert adapter.
- `db/migrations/001_session_outcomes.sql` creates an idempotency table, a TimescaleDB
  hypertable, and an hourly continuous aggregate.
- `db/queries/demo-dashboard.sql` contains judge-safe queries that keep the sample size
  beside every rate.
- Nothing imports the insert adapter from the frontend or an API route yet, so local
  play has no new network dependency.

## Privacy contract

Tiger Data may receive only a completed, anonymous outcome produced from canonical Casey
state. It must never receive:

- the player name or leaderboard nickname;
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
tiger config set read_only true
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
tiger config set read_only true
```

Do not put a Tiger account token or database password in Codex configuration. Tiger MCP
uses the CLI login and local credential store.

## Provision and migrate later

When the frontend demo is frozen:

1. Create or select a Tiger Cloud service in the Tiger Console or with the reviewed MCP.
2. Copy its PostgreSQL connection URL into `.env.local` as `TIGER_DATABASE_URL`; ensure
   it includes `sslmode=require`. Never use a `NEXT_PUBLIC_` prefix.
3. Run `npm run db:migrate` once and `npm run db:verify` to confirm the hypertable and
   continuous aggregate.
4. Add one same-origin, rate-limited server route that accepts a strict allowlisted event
   shape, reconstructs canonical game state, and calls `buildAnonymousSessionOutcome`.
5. Keep localStorage as the fallback. Failed telemetry must never block the Receipt.
6. Run `db/queries/demo-dashboard.sql` in Tiger Console for the live analytics view.

The current repository intentionally stops before steps 1 and 4. A schema file or MCP
installation alone is not evidence of live Tiger Data use; record a real insert, query,
and dashboard before claiming the challenge integration is complete.

## Commands

```bash
npm run db:migrate  # applies the idempotent schema using TIGER_DATABASE_URL
npm run db:verify   # read-only readiness check using TIGER_DATABASE_URL
```

Primary references: [Tiger CLI and MCP](https://github.com/timescale/tiger-cli),
[Tiger Data documentation](https://www.tigerdata.com/docs), and
[HackRice Tiger Data prize](https://www.mlh.com/events/hackrice-71/prizes).
