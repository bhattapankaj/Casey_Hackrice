import "server-only";
import { getTigerDatabaseConfig } from "@/lib/db/config.server";
import type { ScoredSubmission } from "@/lib/board/submission";
import type { BoardRow, BoardStats } from "@/lib/board/types";

export type SharedBoardSnapshot = {
  entries: BoardRow[];
  stats: BoardStats;
};

type BoardStore = {
  write(entry: ScoredSubmission): Promise<void>;
  read(): Promise<SharedBoardSnapshot>;
};

function emptySnapshot(): SharedBoardSnapshot {
  return {
    entries: [],
    stats: { playersTonight: 0, casesPlayed: 0, case01WrongPercent: null },
  };
}

function statsFrom(rows: Array<{ createdAt: string; casesPlayed: number; case01Wrong: boolean | null }>): BoardStats {
  const nightStart = Date.now() - 18 * 60 * 60 * 1000;
  const tonight = rows.filter((row) => Date.parse(row.createdAt) >= nightStart);
  const judged = rows.filter((row) => row.case01Wrong !== null);
  const wrong = judged.filter((row) => row.case01Wrong).length;
  return {
    playersTonight: tonight.length,
    casesPlayed: rows.reduce((total, row) => total + row.casesPlayed, 0),
    case01WrongPercent:
      judged.length === 0 ? null : Math.round((wrong / judged.length) * 100),
  };
}

async function tigerPool() {
  const { getTigerPool } = await import("@/lib/db/pool.server");
  return getTigerPool();
}

function toBoardRow(row: {
  id: string;
  nickname: string;
  score: number;
  casesCleared: number;
  createdAt: string;
}): BoardRow {
  return {
    id: row.id,
    nickname: row.nickname,
    score: row.score,
    casesCleared: row.casesCleared,
    createdAt: row.createdAt,
  };
}

function tigerStore(): BoardStore {
  return {
    async write(entry) {
      await (await tigerPool()).query(
        `INSERT INTO casey.board_entries
          (nickname, score, cases_cleared, cases_played, case01_wrong)
         VALUES ($1, $2, $3, $4, $5)`,
        [entry.nickname, entry.score, entry.casesCleared, entry.casesPlayed, entry.case01Wrong],
      );
    },
    async read() {
      const result = await (
        await tigerPool()
      ).query<{
        id: string;
        nickname: string;
        score: number;
        cases_cleared: number;
        cases_played: number;
        case01_wrong: boolean | null;
        created_at: Date;
      }>(
        `SELECT id::text, nickname, score, cases_cleared, cases_played, case01_wrong, created_at
         FROM casey.board_entries
         ORDER BY score DESC, created_at ASC
         LIMIT 100`,
      );
      const mapped = result.rows.map((row) => ({
        id: row.id,
        nickname: row.nickname,
        score: row.score,
        casesCleared: row.cases_cleared,
        createdAt: row.created_at.toISOString(),
        casesPlayed: row.cases_played,
        case01Wrong: row.case01_wrong,
      }));
      return {
        entries: mapped.map(toBoardRow),
        stats: statsFrom(mapped),
      };
    },
  };
}

function kvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim());
}

function kvStore(): BoardStore {
  const url = process.env.KV_REST_API_URL!.replace(/\/$/, "");
  const token = process.env.KV_REST_API_TOKEN!;
  const key = "casey:board:v1";

  async function command<T>(...args: Array<string | number>): Promise<T> {
    const response = await fetch(`${url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("KV request failed");
    }
    const body = (await response.json()) as { result: T };
    return body.result;
  }

  return {
    async write(entry) {
      const row = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nickname: entry.nickname,
        score: entry.score,
        casesCleared: entry.casesCleared,
        casesPlayed: entry.casesPlayed,
        case01Wrong: entry.case01Wrong,
        createdAt: new Date().toISOString(),
      };
      const raw = await command<string | null>("GET", key);
      const current = raw ? (JSON.parse(raw) as unknown[]) : [];
      current.push(row);
      await command("SET", key, JSON.stringify(current));
    },
    async read() {
      const raw = await command<string | null>("GET", key);
      const current = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
      const mapped = current
        .filter((row) => typeof row.nickname === "string" && typeof row.score === "number")
        .map((row) => ({
          id: String(row.id ?? row.createdAt ?? row.nickname),
          nickname: row.nickname as string,
          score: row.score as number,
          casesCleared: Number(row.casesCleared ?? 0),
          casesPlayed: Number(row.casesPlayed ?? 0),
          case01Wrong: typeof row.case01Wrong === "boolean" ? row.case01Wrong : null,
          createdAt: String(row.createdAt ?? new Date().toISOString()),
        }))
        .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
      return {
        entries: mapped.map(toBoardRow),
        stats: statsFrom(mapped),
      };
    },
  };
}

export function getBoardStore(): BoardStore | null {
  try {
    if (getTigerDatabaseConfig()) {
      return tigerStore();
    }
  } catch {
    // A present-but-invalid Tiger URL must not take the board down.
  }
  if (kvConfigured()) {
    return kvStore();
  }
  return null;
}

export { emptySnapshot };
