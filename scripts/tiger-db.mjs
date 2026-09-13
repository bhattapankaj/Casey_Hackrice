import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

if (!process.env.TIGER_DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const { Client } = pg;
const command = process.argv[2] ?? "verify";
const connectionString = process.env.TIGER_DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("Set TIGER_DATABASE_URL before running a Tiger Data command");
}

let connectionUrl;
try {
  connectionUrl = new URL(connectionString);
} catch {
  throw new Error("TIGER_DATABASE_URL must be a valid PostgreSQL connection URL");
}

if (!["postgres:", "postgresql:"].includes(connectionUrl.protocol)) {
  throw new Error("TIGER_DATABASE_URL must use postgres:// or postgresql://");
}
if (
  !["require", "verify-ca", "verify-full"].includes(
    connectionUrl.searchParams.get("sslmode"),
  )
) {
  throw new Error("TIGER_DATABASE_URL must include sslmode=require or stronger");
}
if (command !== "migrate" && command !== "verify") {
  throw new Error("Use either migrate or verify");
}

const client = new Client({ connectionString });

try {
  await client.connect();

  if (command === "migrate") {
    const migrationsDir = new URL("../db/migrations/", import.meta.url);
    const files = (await readdir(fileURLToPath(migrationsDir)))
      .filter((name) => name.endsWith(".sql"))
      .sort();
    for (const name of files) {
      const migration = await readFile(new URL(name, migrationsDir), "utf8");
      await client.query(migration);
    }
  }

  const result = await client.query(`
    SELECT
      EXISTS (
        SELECT 1
        FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'casey'
          AND hypertable_name = 'session_outcomes'
      ) AS hypertable_ready,
      to_regclass('casey.outcomes_hourly') IS NOT NULL AS aggregate_ready
      ,to_regclass('casey.board_entries') IS NOT NULL AS board_ready
      ,EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'casey'
          AND tablename = 'board_entries'
          AND indexname = 'board_entries_submission_id_idx'
      ) AS board_idempotency_ready
  `);
  const readiness = result.rows[0];
  if (
    !readiness?.hypertable_ready ||
    !readiness?.aggregate_ready ||
    !readiness?.board_ready ||
    !readiness?.board_idempotency_ready
  ) {
    throw new Error("Tiger Data schema is incomplete; run npm run db:migrate");
  }

  console.log("Tiger Data outcome and leaderboard schema is ready.");
} finally {
  await client.end();
}
