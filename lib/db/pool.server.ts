import "server-only";
import { Pool } from "pg";
import { getTigerDatabaseConfig } from "@/lib/db/config.server";

let pool: Pool | undefined;

/** Lazily creates one small pool. Importing this module never opens a connection. */
export function getTigerPool(): Pool {
  if (pool) return pool;

  const config = getTigerDatabaseConfig();
  if (!config) {
    throw new Error("Tiger Data is not configured");
  }

  pool = new Pool({
    connectionString: config.connectionString,
    max: config.poolMax,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
  return pool;
}

export async function closeTigerPool(): Promise<void> {
  const current = pool;
  pool = undefined;
  await current?.end();
}
