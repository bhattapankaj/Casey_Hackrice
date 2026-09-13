import { describe, expect, it, vi } from "vitest";
import { CASE_01 } from "@/lib/cases/case-01";
import { getTigerDatabaseConfig } from "@/lib/db/config.server";
import { insertAnonymousSessionOutcome } from "@/lib/db/outcomes.server";
import { buildAnonymousSessionOutcome } from "@/lib/db/session-outcome";
import { createInitialSession, reduceSession } from "@/lib/engine/reducer";
import type { GameEvent, GameSession } from "@/lib/engine/types";

vi.mock("server-only", () => ({}));

const START = "2026-09-12T12:00:00.000Z";
const COMMIT = "2026-09-12T12:01:00.000Z";
const OUTCOME_ID = "01994677-4a80-7a55-8dc2-0242ac120002";

function play(events: GameEvent[]): GameSession {
  return events.reduce(
    (session, event) => reduceSession(CASE_01, session, event),
    createInitialSession(CASE_01, START),
  );
}

function idealSession(): GameSession {
  return play([
    { type: "SELECT_MODE", mode: "text_fallback", at: START },
    { type: "DEAL_PRESSURE_CARD", tactic: "urgency" },
    { type: "TAKE_ACTION", actionId: "call-supplied-number" },
    { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
    { type: "TAKE_ACTION", actionId: "call-directory-number" },
    { type: "PIN_EVIDENCE", artifactId: "offer-email" },
    { type: "PIN_EVIDENCE", artifactId: "directory-call" },
    { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
  ]);
}

describe("Tiger Data server configuration", () => {
  it("is optional when no database URL is set", () => {
    expect(getTigerDatabaseConfig({})).toBeNull();
  });

  it("accepts only credentialed, TLS-required PostgreSQL URLs", () => {
    expect(
      getTigerDatabaseConfig({
        TIGER_DATABASE_URL:
          "postgresql://casey:secret@service.example:5432/casey?sslmode=require",
        TIGER_DATABASE_POOL_MAX: "4",
      }),
    ).toEqual({
      connectionString:
        "postgresql://casey:secret@service.example:5432/casey?sslmode=require",
      poolMax: 4,
    });

    expect(() =>
      getTigerDatabaseConfig({
        TIGER_DATABASE_URL: "postgresql://casey:secret@service.example:5432/casey",
      }),
    ).toThrow("require TLS");
    expect(() =>
      getTigerDatabaseConfig({
        TIGER_DATABASE_URL: "https://service.example/casey?sslmode=require",
      }),
    ).toThrow("must use postgres");
  });

  it("bounds the connection pool", () => {
    expect(() =>
      getTigerDatabaseConfig({
        TIGER_DATABASE_URL:
          "postgresql://casey:secret@service.example:5432/casey?sslmode=require",
        TIGER_DATABASE_POOL_MAX: "100",
      }),
    ).toThrow("1 to 10");
  });
});

describe("anonymous outcome boundary", () => {
  it("derives a minimal outcome from canonical engine state", () => {
    const outcome = buildAnonymousSessionOutcome({
      caseFile: CASE_01,
      session: idealSession(),
      sessionId: OUTCOME_ID,
      occurredAt: COMMIT,
    });

    expect(outcome).toMatchObject({
      version: 1,
      sessionId: OUTCOME_ID,
      occurredAt: COMMIT,
      caseId: "case-01",
      mode: "text_fallback",
      selectedVerdict: "scam",
      truth: "scam",
      verdictCorrect: true,
      totalScore: 1000,
      verdictScore: 400,
      independenceScore: 300,
      evidenceQualityScore: 200,
      composureScore: 100,
      evidenceCount: 2,
      independentRouteUsed: true,
      independentEvidencePinned: true,
      pressureCardCount: 1,
      durationSeconds: 60,
    });
    expect(Object.keys(outcome)).not.toEqual(
      expect.arrayContaining(["playerName", "nickname", "transcript", "audio", "ip"]),
    );
  });

  it("rejects incomplete sessions and non-UUID identifiers", () => {
    expect(() =>
      buildAnonymousSessionOutcome({
        caseFile: CASE_01,
        session: createInitialSession(CASE_01, START),
        sessionId: OUTCOME_ID,
        occurredAt: COMMIT,
      }),
    ).toThrow("Only completed sessions");
    expect(() =>
      buildAnonymousSessionOutcome({
        caseFile: CASE_01,
        session: idealSession(),
        sessionId: "player-name",
        occurredAt: COMMIT,
      }),
    ).toThrow("must be a UUID");
  });

  it("uses a parameterized, idempotent insert", async () => {
    const outcome = buildAnonymousSessionOutcome({
      caseFile: CASE_01,
      session: idealSession(),
      sessionId: OUTCOME_ID,
      occurredAt: COMMIT,
    });
    const query = vi.fn(async (text: string, values: unknown[]) => {
      void text;
      void values;
      return { rowCount: 1 };
    });

    await expect(insertAnonymousSessionOutcome(outcome, { query })).resolves.toBe(true);
    const [sql, values] = query.mock.calls[0]!;
    expect(sql).toContain("$1");
    expect(sql).toContain("ON CONFLICT");
    expect(sql).not.toContain(OUTCOME_ID);
    expect(values).toHaveLength(17);
    expect(values[0]).toBe(OUTCOME_ID);
  });
});
