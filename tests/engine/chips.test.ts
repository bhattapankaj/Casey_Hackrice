import { describe, expect, it } from "vitest";
import { resolveStake, STARTING_CHIPS } from "@/lib/engine/chips";

describe("resolveStake", () => {
  it("adds the stake when the verdict is correct", () => {
    expect(resolveStake(STARTING_CHIPS, 50, true)).toBe(150);
  });

  it("subtracts the stake when wrong and floors at zero", () => {
    expect(resolveStake(STARTING_CHIPS, 25, false)).toBe(75);
    expect(resolveStake(10, 50, false)).toBe(0);
    expect(resolveStake(0, 10, false)).toBe(0);
  });
});
