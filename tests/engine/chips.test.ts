import { describe, expect, it } from "vitest";
import {
  canAffordStake,
  defaultStakeForChips,
  resolveStake,
  STARTING_CHIPS,
} from "@/lib/engine/chips";

describe("resolveStake", () => {
  it("adds the stake when the verdict is correct", () => {
    expect(resolveStake(STARTING_CHIPS, 50, true)).toBe(150);
  });

  it("subtracts the stake when wrong and floors at zero", () => {
    expect(resolveStake(STARTING_CHIPS, 25, false)).toBe(75);
    expect(resolveStake(10, 50, false)).toBe(0);
    expect(resolveStake(0, 10, false)).toBe(0);
  });

  it("never pays winnings on chips the player did not have", () => {
    expect(resolveStake(10, 50, true)).toBe(20);
    expect(resolveStake(0, 10, true)).toBe(0);
  });

  it("offers only an affordable default stake", () => {
    expect(defaultStakeForChips(100)).toBe(25);
    expect(defaultStakeForChips(10)).toBe(10);
    expect(canAffordStake(24, 25)).toBe(false);
    expect(canAffordStake(25, 25)).toBe(true);
  });
});
