import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createTigerBoardStore } from "@/lib/db/board.server";

const SUBMISSION_ID = "01994677-4a80-7a55-8dc2-0242ac120002";

describe("Tiger leaderboard store", () => {
  it("upserts one row per browser submission identity", async () => {
    const query = vi.fn(async (sql: string, values?: unknown[]) => {
      void sql;
      void values;
      return { rows: [] };
    });
    const store = createTigerBoardStore({ query });

    await store.write({
      submissionId: SUBMISSION_ID,
      nickname: "Jordan",
      score: 875,
      casesCleared: 2,
      casesPlayed: 3,
      case01Wrong: false,
      bestHand: "Pair",
      chips: 125,
    });

    const [sql, values] = query.mock.calls[0]!;
    expect(sql).toContain("ON CONFLICT (submission_id) DO UPDATE");
    expect(sql).toContain("updated_at = now()");
    expect(sql).toContain("best_hand");
    expect(sql).toContain("chips");
    expect(values).toEqual([SUBMISSION_ID, "Jordan", 875, 2, 3, false, "Pair", 125]);
  });

  it("reads ranked rows and computes totals across the whole table", async () => {
    const now = new Date("2026-09-13T05:00:00.000Z");
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("ORDER BY score")) {
        return {
          rows: [
            {
              submission_id: SUBMISSION_ID,
              nickname: "Jordan",
              score: 875,
              cases_cleared: 2,
              cases_played: 3,
              case01_wrong: false,
              best_hand: "Pair",
              chips: 125,
              created_at: now,
              updated_at: now,
            },
          ],
        };
      }
      return {
        rows: [
          {
            players_tonight: "12",
            cases_played: "31",
            case01_judged: "10",
            case01_wrong: "3",
          },
        ],
      };
    });
    const store = createTigerBoardStore({ query });

    await expect(store.read()).resolves.toEqual({
      entries: [
        {
          id: SUBMISSION_ID,
          nickname: "Jordan",
          username: "Jordan-019946",
          score: 875,
          casesCleared: 2,
          bestHand: "Pair",
          chips: 125,
          createdAt: now.toISOString(),
        },
      ],
      stats: {
        playersTonight: 12,
        casesPlayed: 31,
        case01WrongPercent: 30,
      },
    });
    expect(query.mock.calls[0]?.[0]).not.toContain("LIMIT");
  });
});
