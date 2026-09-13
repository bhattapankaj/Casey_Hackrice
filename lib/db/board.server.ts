import "server-only";
import { getTigerDatabaseConfig } from "@/lib/db/config.server";
import type { ScoredSubmission } from "@/lib/board/submission";
import type { BoardRow, BoardStats } from "@/lib/board/types";
import { boardUsername } from "@/lib/board/identity";
import { HANDS, type Hand } from "@/lib/engine/hand";
import { STARTING_CHIPS } from "@/lib/engine/chips";
import { sortBoardRows } from "@/lib/board/local";

export type SharedBoardSnapshot = {
  entries: BoardRow[];
  stats: BoardStats;
};

type BoardStore = {
  write(entry: ScoredSubmission & { submissionId: string }): Promise<void>;
  read(): Promise<SharedBoardSnapshot>;
};

type BoardSqlExecutor = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }>;
};

function emptySnapshot(): SharedBoardSnapshot {
  return {
    entries: [],
    stats: { playersTonight: 0, casesPlayed: 0, case01WrongPercent: null },
  };
}

function statsFrom(rows: Array<{ updatedAt: string; casesPlayed: number; case01Wrong: boolean | null }>): BoardStats {
  const nightStart = Date.now() - 18 * 60 * 60 * 1000;
  const tonight = rows.filter((row) => Date.parse(row.updatedAt) >= nightStart);
  const judged = rows.filter((row) => row.case01Wrong !== null);
  const wrong = judged.filter((row) => row.case01Wrong).length;
  return {
    playersTonight: tonight.length,
    casesPlayed: rows.reduce((total, row) => total + row.casesPlayed, 0),
    case01WrongPercent:
      judged.length === 0 ? null : Math.round((wrong / judged.length) * 100),
  };
}

function parseHand(value: unknown): Hand | null {
  return typeof value === "string" && (HANDS as readonly string[]).includes(value)
    ? (value as Hand)
    : null;
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
  bestHand: Hand | null;
  chips: number;
  createdAt: string;
}): BoardRow {
  return {
    id: row.id,
    nickname: row.nickname,
    username: boardUsername(row.nickname, row.id),
    score: row.score,
    casesCleared: row.casesCleared,
    bestHand: row.bestHand,
    chips: row.chips,
    createdAt: row.createdAt,
  };
}

function tigerStore(executor?: BoardSqlExecutor): BoardStore {
  const sql = async () => executor ?? (await tigerPool());
  return {
    async write(entry) {
      await (await sql()).query(
        `INSERT INTO casey.board_entries
          (submission_id, nickname, score, cases_cleared, cases_played, case01_wrong, best_hand, chips)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (submission_id) DO UPDATE SET
           nickname = EXCLUDED.nickname,
           score = EXCLUDED.score,
           cases_cleared = EXCLUDED.cases_cleared,
           cases_played = EXCLUDED.cases_played,
           case01_wrong = EXCLUDED.case01_wrong,
           best_hand = EXCLUDED.best_hand,
           chips = EXCLUDED.chips,
           updated_at = now()`,
        [
          entry.submissionId,
          entry.nickname,
          entry.score,
          entry.casesCleared,
          entry.casesPlayed,
          entry.case01Wrong,
          entry.bestHand,
          entry.chips,
        ],
      );
    },
    async read() {
      const database = await sql();
      const [result, aggregate] = await Promise.all([
        database.query(
          `SELECT submission_id::text, nickname, score, cases_cleared, cases_played,
                  case01_wrong, best_hand, chips, created_at, updated_at
           FROM casey.board_entries
           ORDER BY score DESC, created_at ASC`,
        ),
        database.query(
          `SELECT
             COUNT(*) FILTER (WHERE updated_at >= now() - INTERVAL '18 hours') AS players_tonight,
             COALESCE(SUM(cases_played), 0) AS cases_played,
             COUNT(*) FILTER (WHERE case01_wrong IS NOT NULL) AS case01_judged,
             COUNT(*) FILTER (WHERE case01_wrong = TRUE) AS case01_wrong
           FROM casey.board_entries`,
        ),
      ]);
      const rows = result.rows as Array<{
        submission_id: string;
        nickname: string;
        score: number;
        cases_cleared: number;
        cases_played: number;
        case01_wrong: boolean | null;
        best_hand: string | null;
        chips: number | null;
        created_at: Date;
        updated_at: Date;
      }>;
      const mapped = rows.map((row) => ({
        id: row.submission_id,
        nickname: row.nickname,
        score: row.score,
        casesCleared: row.cases_cleared,
        bestHand: parseHand(row.best_hand),
        chips: typeof row.chips === "number" ? row.chips : STARTING_CHIPS,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        casesPlayed: row.cases_played,
        case01Wrong: row.case01_wrong,
      }));
      const counts = aggregate.rows[0] as
        | {
            players_tonight: string | number;
            cases_played: string | number;
            case01_judged: string | number;
            case01_wrong: string | number;
          }
        | undefined;
      const judged = Number(counts?.case01_judged ?? 0);
      const wrong = Number(counts?.case01_wrong ?? 0);
      return {
        entries: sortBoardRows(
          mapped.map((row) =>
            toBoardRow({
              id: row.id,
              nickname: row.nickname,
              score: row.score,
              casesCleared: row.casesCleared,
              bestHand: row.bestHand,
              chips: row.chips,
              createdAt: row.createdAt,
            }),
          ),
        ),
        stats: {
          playersTonight: Number(counts?.players_tonight ?? 0),
          casesPlayed: Number(counts?.cases_played ?? 0),
          case01WrongPercent: judged === 0 ? null : Math.round((wrong / judged) * 100),
        },
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
        id: entry.submissionId,
        nickname: entry.nickname,
        score: entry.score,
        casesCleared: entry.casesCleared,
        casesPlayed: entry.casesPlayed,
        case01Wrong: entry.case01Wrong,
        bestHand: entry.bestHand,
        chips: entry.chips,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const raw = await command<string | null>("GET", key);
      const current = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
      const existing = current.findIndex((candidate) => candidate.id === entry.submissionId);
      if (existing >= 0) {
        row.createdAt = String(current[existing]?.createdAt ?? row.createdAt);
        current[existing] = row;
      } else {
        current.push(row);
      }
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
          bestHand: parseHand(row.bestHand),
          chips: typeof row.chips === "number" ? row.chips : STARTING_CHIPS,
          createdAt: String(row.createdAt ?? new Date().toISOString()),
          updatedAt: String(row.updatedAt ?? row.createdAt ?? new Date().toISOString()),
        }));
      return {
        entries: sortBoardRows(
          mapped.map((row) =>
            toBoardRow({
              id: row.id,
              nickname: row.nickname,
              score: row.score,
              casesCleared: row.casesCleared,
              bestHand: row.bestHand,
              chips: row.chips,
              createdAt: row.createdAt,
            }),
          ),
        ),
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
export { tigerStore as createTigerBoardStore };
