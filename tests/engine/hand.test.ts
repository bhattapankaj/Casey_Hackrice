import { describe, expect, it } from "vitest";
import { explainHand, rankHand } from "@/lib/engine/hand";

describe("rankHand", () => {
  it("returns High card when the verdict is wrong", () => {
    expect(
      rankHand({ correct: false, outOfBandPinned: 3, inBandPinned: 0, firstAttempt: true }),
    ).toBe("High card");
  });

  it("returns High card for a correct verdict with only in-band pins", () => {
    expect(
      rankHand({ correct: true, outOfBandPinned: 0, inBandPinned: 2, firstAttempt: true }),
    ).toBe("High card");
    expect(
      explainHand("High card", true),
    ).toBe("Correct, but every source traced back to them.");
  });

  it("ranks Pair and Two pair from out-of-band counts", () => {
    expect(
      rankHand({ correct: true, outOfBandPinned: 1, inBandPinned: 2, firstAttempt: false }),
    ).toBe("Pair");
    expect(
      rankHand({ correct: true, outOfBandPinned: 2, inBandPinned: 1, firstAttempt: false }),
    ).toBe("Two pair");
  });

  it("requires three or more out-of-band and zero in-band for Flush", () => {
    expect(
      rankHand({ correct: true, outOfBandPinned: 3, inBandPinned: 0, firstAttempt: false }),
    ).toBe("Flush");
    expect(
      rankHand({ correct: true, outOfBandPinned: 3, inBandPinned: 1, firstAttempt: false }),
    ).toBe("Two pair");
  });

  it("requires first attempt for Royal flush", () => {
    expect(
      rankHand({ correct: true, outOfBandPinned: 3, inBandPinned: 0, firstAttempt: true }),
    ).toBe("Royal flush");
    expect(
      rankHand({ correct: true, outOfBandPinned: 3, inBandPinned: 0, firstAttempt: false }),
    ).toBe("Flush");
  });
});
