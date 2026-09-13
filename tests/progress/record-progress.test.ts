import { describe, expect, it } from "vitest";
import {
  catalogStats,
  emptyProgress,
  prepareCaseRun,
  recordCaseResult,
  resetProgress,
} from "@/lib/progress";
import { STARTING_CHIPS } from "@/lib/engine/chips";

const ORDER = ["case-01", "case-02", "case-03"] as const;

const baseResult = {
  usedOutOfBand: false,
  hand: "High card" as const,
  stake: 25 as const,
};

describe("progress recording", () => {
  it("settles a case once and ignores later practice results", () => {
    let progress = recordCaseResult(emptyProgress(), {
      caseId: "case-01",
      verdict: "scam",
      score: 75,
      correct: true,
      at: "2026-09-13T00:00:00.000Z",
      ...baseResult,
    });
    expect(progress.chips).toBe(STARTING_CHIPS + 25);
    const settled = progress;
    progress = recordCaseResult(settled, {
      caseId: "case-01",
      verdict: "scam",
      score: 150,
      correct: true,
      usedOutOfBand: true,
      pinnedArtifactIds: ["directory-call"],
      hand: "Pair",
      stake: 50,
      at: "2026-09-13T00:01:00.000Z",
    });
    expect(progress).toBe(settled);
    expect(progress.cases["case-01"]?.bestScore).toBe(75);
    expect(progress.cases["case-01"]?.bestHand).toBe("High card");
    expect(progress.cases["case-01"]?.attempts).toBe(1);
    expect(progress.cases["case-01"]?.bestVerdict).toBe("scam");
    expect(progress.cases["case-01"]?.bestPinnedArtifactIds).toEqual([]);
    expect(progress.chips).toBe(STARTING_CHIPS + 25);

    progress = recordCaseResult(progress, {
      caseId: "case-01",
      verdict: "legit",
      score: 0,
      correct: false,
      usedOutOfBand: true,
      pinnedArtifactIds: ["offer-email"],
      hand: "High card",
      stake: 50,
      at: "2026-09-13T00:02:00.000Z",
    });
    expect(progress).toBe(settled);
    expect(progress.cases["case-01"]?.bestScore).toBe(75);
    expect(progress.cases["case-01"]?.cleared).toBe(true);
    expect(progress.cases["case-01"]?.bestVerdict).toBe("scam");
    expect(progress.cases["case-01"]?.bestPinnedArtifactIds).toEqual([]);
    expect(progress.chips).toBe(STARTING_CHIPS + 25);
  });

  it("tops up an unplayed case to the 10-chip table reserve", () => {
    const prepared = prepareCaseRun({ ...emptyProgress(), chips: 3 }, "case-01");
    expect(prepared).toMatchObject({ caseId: "case-01", mode: "ranked", reserveGranted: true });
    expect(prepared.progress.chips).toBe(10);
    expect(prepareCaseRun(prepared.progress, "case-01")).toMatchObject({
      mode: "ranked",
      reserveGranted: false,
    });
  });

  it("opens any previously submitted case as practice without another reserve", () => {
    const settled = recordCaseResult({ ...emptyProgress(), chips: 10 }, {
      caseId: "case-01",
      verdict: "legit",
      score: 0,
      correct: false,
      at: "2026-09-13T00:00:00.000Z",
      ...baseResult,
    });
    expect(settled.chips).toBe(0);
    expect(prepareCaseRun(settled, "case-01")).toEqual({
      caseId: "case-01",
      mode: "practice",
      progress: settled,
      reserveGranted: false,
    });
  });

  it("counts the longest run of correct first-attempt verdicts", () => {
    let progress = recordCaseResult(emptyProgress(), {
      caseId: "case-01",
      verdict: "scam",
      score: 150,
      correct: true,
      usedOutOfBand: true,
      hand: "Pair",
      stake: 25,
      at: "2026-09-13T00:00:00.000Z",
    });
    progress = recordCaseResult(progress, {
      caseId: "case-02",
      verdict: "scam",
      score: 150,
      correct: true,
      usedOutOfBand: true,
      hand: "Pair",
      stake: 25,
      at: "2026-09-13T00:01:00.000Z",
    });
    expect(catalogStats(progress, ORDER).bestStreak).toBe(2);

    progress = recordCaseResult(progress, {
      caseId: "case-03",
      verdict: "scam",
      score: 0,
      correct: false,
      usedOutOfBand: false,
      hand: "High card",
      stake: 25,
      at: "2026-09-13T00:02:00.000Z",
    });
    expect(catalogStats(progress, ORDER).bestStreak).toBe(2);

    progress = recordCaseResult(progress, {
      caseId: "case-03",
      verdict: "legit",
      score: 150,
      correct: true,
      usedOutOfBand: true,
      hand: "Pair",
      stake: 25,
      at: "2026-09-13T00:03:00.000Z",
    });
    expect(catalogStats(progress, ORDER).bestStreak).toBe(2);
  });

  it("clears nickname, chips, and cases on reset", () => {
    const started = recordCaseResult(
      {
        version: 1,
        nickname: "Judge",
        nicknameAsked: true,
        chips: 40,
        cases: {},
      },
      {
        caseId: "case-01",
        verdict: "scam",
        score: 100,
        correct: true,
        usedOutOfBand: false,
        hand: "High card",
        stake: 25,
        at: "2026-09-13T00:00:00.000Z",
      },
    );
    expect(resetProgress()).toEqual(emptyProgress());
    expect(started.nickname).toBe("Judge");
  });

  it("floors chips at zero without blocking later play", () => {
    const progress = recordCaseResult(
      { ...emptyProgress(), chips: 10 },
      {
        caseId: "case-01",
        verdict: "legit",
        score: 0,
        correct: false,
        usedOutOfBand: false,
        hand: "High card",
        stake: 50,
        at: "2026-09-13T00:00:00.000Z",
      },
    );
    expect(progress.chips).toBe(0);
  });
});
