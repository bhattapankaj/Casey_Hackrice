import { describe, expect, it } from "vitest";
import { CASE_01 } from "@/lib/cases/case-01";
import {
  parseCaseResults,
  parseSubmissionId,
  sanitizeNickname,
  scoreBoardSubmission,
} from "@/lib/board/submission";

const lookup = (id: string) => (id === "case-01" ? CASE_01 : undefined);

describe("board submission", () => {
  it("accepts only canonical UUID submission identities", () => {
    expect(parseSubmissionId("01994677-4A80-7A55-8DC2-0242AC120002")).toBe(
      "01994677-4a80-7a55-8dc2-0242ac120002",
    );
    expect(parseSubmissionId("Jordan")).toBeNull();
    expect(parseSubmissionId("01994677-4a80-7a55-0000-0242ac120002")).toBeNull();
  });

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
      firstAttempt: false,
    });
    expect(scoreBoardSubmission("A", parsed!, lookup)).toMatchObject({ score: 0 });
  });

  it("rejects malformed, duplicate, and over-limit pin arrays", () => {
    expect(
      parseCaseResults({
        "case-01": { verdict: "scam", pinnedArtifactIds: ["offer-email", 7] },
      }),
    ).toBeNull();
    expect(
      parseCaseResults({
        "case-01": {
          verdict: "scam",
          pinnedArtifactIds: ["offer-email", "offer-email"],
        },
      }),
    ).toBeNull();
    expect(
      parseCaseResults({
        "case-01": {
          verdict: "scam",
          pinnedArtifactIds: ["a", "b", "c", "d"],
        },
      }),
    ).toBeNull();
  });

  it("computes best hand from pins", () => {
    const scored = scoreBoardSubmission(
      "Jordan",
      {
        "case-01": {
          verdict: "scam",
          pinnedArtifactIds: ["offer-email"],
          firstAttempt: true,
        },
      },
      lookup,
    );
    expect(scored).toMatchObject({ bestHand: "High card", chips: 100 });
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
