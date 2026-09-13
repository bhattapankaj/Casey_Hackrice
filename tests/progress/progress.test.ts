import { describe, expect, it } from "vitest";
import {
  catalogStats,
  caseStatus,
  emptyProgress,
  parseProgress,
} from "@/lib/progress";

describe("casey_progress_v1", () => {
  it("returns zeros for a missing or corrupt payload", () => {
    expect(parseProgress(null)).toEqual(emptyProgress());
    expect(parseProgress("{")).toEqual(emptyProgress());
    expect(parseProgress('{"version":2}')).toEqual(emptyProgress());
    expect(catalogStats(emptyProgress())).toEqual({
      casesCompleted: 0,
      bestStreak: 0,
      totalScore: 0,
    });
  });

  it("reads cleared cases without dropping a later score", () => {
    const progress = parseProgress(
      JSON.stringify({
        version: 1,
        nickname: null,
        cases: {
          "case-01": {
            attempts: 2,
            bestScore: 400,
            cleared: true,
            lastVerdict: "scam",
            usedOutOfBand: true,
            clearedAt: "2026-09-13T00:00:00.000Z",
          },
        },
      }),
    );
    expect(caseStatus(progress, "case-01")).toBe("cleared");
    expect(caseStatus(progress, "case-02")).toBe("not_attempted");
    expect(catalogStats(progress)).toEqual({
      casesCompleted: 1,
      bestStreak: 0,
      totalScore: 400,
    });
  });
});
