import { describe, expect, it } from "vitest";
import {
  catalogStats,
  emptyProgress,
  recordCaseResult,
  resetProgress,
} from "@/lib/progress";

const ORDER = ["case-01", "case-02", "case-03"] as const;

describe("progress recording", () => {
  it("keeps the higher score when a case is replayed", () => {
    let progress = recordCaseResult(emptyProgress(), {
      caseId: "case-01",
      verdict: "scam",
      score: 75,
      correct: true,
      usedOutOfBand: false,
      at: "2026-09-13T00:00:00.000Z",
    });
    progress = recordCaseResult(progress, {
      caseId: "case-01",
      verdict: "scam",
      score: 150,
      correct: true,
      usedOutOfBand: true,
      at: "2026-09-13T00:01:00.000Z",
    });
    expect(progress.cases["case-01"]?.bestScore).toBe(150);
    expect(progress.cases["case-01"]?.attempts).toBe(2);

    progress = recordCaseResult(progress, {
      caseId: "case-01",
      verdict: "legit",
      score: 0,
      correct: false,
      usedOutOfBand: true,
      at: "2026-09-13T00:02:00.000Z",
    });
    expect(progress.cases["case-01"]?.bestScore).toBe(150);
    expect(progress.cases["case-01"]?.cleared).toBe(true);
  });

  it("counts the longest run of correct first-attempt verdicts", () => {
    let progress = recordCaseResult(emptyProgress(), {
      caseId: "case-01",
      verdict: "scam",
      score: 150,
      correct: true,
      usedOutOfBand: true,
      at: "2026-09-13T00:00:00.000Z",
    });
    progress = recordCaseResult(progress, {
      caseId: "case-02",
      verdict: "scam",
      score: 150,
      correct: true,
      usedOutOfBand: true,
      at: "2026-09-13T00:01:00.000Z",
    });
    expect(catalogStats(progress, ORDER).bestStreak).toBe(2);

    progress = recordCaseResult(progress, {
      caseId: "case-03",
      verdict: "scam",
      score: 0,
      correct: false,
      usedOutOfBand: false,
      at: "2026-09-13T00:02:00.000Z",
    });
    expect(catalogStats(progress, ORDER).bestStreak).toBe(2);

    progress = recordCaseResult(progress, {
      caseId: "case-03",
      verdict: "legit",
      score: 150,
      correct: true,
      usedOutOfBand: true,
      at: "2026-09-13T00:03:00.000Z",
    });
    expect(catalogStats(progress, ORDER).bestStreak).toBe(2);
  });

  it("clears nickname and cases on reset", () => {
    const started = recordCaseResult(
      { version: 1, nickname: "Judge", nicknameAsked: true, cases: {} },
      {
        caseId: "case-01",
        verdict: "scam",
        score: 100,
        correct: true,
        usedOutOfBand: false,
        at: "2026-09-13T00:00:00.000Z",
      },
    );
    expect(resetProgress()).toEqual(emptyProgress());
    expect(started.nickname).toBe("Judge");
  });
});
