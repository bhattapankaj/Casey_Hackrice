import { describe, expect, it } from "vitest";
import { CASE_01 } from "@/lib/cases/case-01";
import {
  parseCaseResults,
  sanitizeNickname,
  scoreBoardSubmission,
} from "@/lib/board/submission";

const lookup = (id: string) => (id === "case-01" ? CASE_01 : undefined);

describe("board submission", () => {
  it("strips nickname characters that are not allowed", () => {
    expect(sanitizeNickname("Judge 01!")).toBe("Judge 01");
    expect(sanitizeNickname("ok_name-1")).toBe("ok_name-1");
    expect(sanitizeNickname("********************")).toBeNull();
    expect(sanitizeNickname("thisnameiswaytoolongtofit")).toBe("thisnameiswaytoolong");
  });

  it("rescores from verdict and pins and ignores a client-sent total", () => {
    const scored = scoreBoardSubmission(
      "Jordan",
      {
        "case-01": { verdict: "scam", pinnedArtifactIds: ["offer-email"] },
      },
      lookup,
    );
    expect(scored).toMatchObject({
      nickname: "Jordan",
      score: 75,
      casesCleared: 1,
      case01Wrong: false,
    });
  });

  it("does not accept a client score in place of the engine", () => {
    const parsed = parseCaseResults({
      "case-01": {
        verdict: "legit",
        pinnedArtifactIds: ["offer-email", "directory-call"],
        score: 9999,
      },
    });
    expect(parsed?.["case-01"]).toEqual({
      verdict: "legit",
      pinnedArtifactIds: ["offer-email", "directory-call"],
    });
    expect(scoreBoardSubmission("A", parsed!, lookup)).toMatchObject({ score: 0 });
  });

  it("rejects unknown cases and unknown pins", () => {
    expect(
      scoreBoardSubmission(
        "A",
        { "case-99": { verdict: "scam", pinnedArtifactIds: [] } },
        lookup,
      ),
    ).toEqual({ error: "Unknown case" });
    expect(
      scoreBoardSubmission(
        "A",
        { "case-01": { verdict: "scam", pinnedArtifactIds: ["not-real"] } },
        lookup,
      ),
    ).toEqual({ error: "Unknown pinned artifact" });
  });
});
