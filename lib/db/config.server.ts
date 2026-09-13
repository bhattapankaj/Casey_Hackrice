import "server-only";

export type TigerDatabaseConfig = {
  connectionString: string;
  poolMax: number;
};

type TigerDatabaseEnvironment = {
  [key: string]: string | undefined;
  TIGER_DATABASE_URL?: string;
  TIGER_DATABASE_POOL_MAX?: string;
};

const SECURE_SSL_MODES = new Set(["require", "verify-ca", "verify-full"]);

function parsePoolMax(value: string | undefined): number {
  if (!value) return 3;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
    throw new Error("TIGER_DATABASE_POOL_MAX must be an integer from 1 to 10");
  }
  return parsed;
}

/**
 * Reads server-only Tiger Data configuration without logging or returning credentials
 * in errors. A missing URL is an allowed state so the local-only demo still builds.
 */
export function getTigerDatabaseConfig(
  environment: TigerDatabaseEnvironment = process.env,
): TigerDatabaseConfig | null {
  const connectionString = environment.TIGER_DATABASE_URL?.trim();
  if (!connectionString) return null;

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("TIGER_DATABASE_URL must be a valid PostgreSQL connection URL");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("TIGER_DATABASE_URL must use postgres:// or postgresql://");
  }
  if (!url.hostname || !url.username || !url.password) {
    throw new Error("TIGER_DATABASE_URL is missing required connection credentials");
  }
  if (!SECURE_SSL_MODES.has(url.searchParams.get("sslmode") ?? "")) {
    throw new Error("TIGER_DATABASE_URL must require TLS with sslmode=require or stronger");
  }

  return {
    connectionString,
    poolMax: parsePoolMax(environment.TIGER_DATABASE_POOL_MAX),
  };
}
