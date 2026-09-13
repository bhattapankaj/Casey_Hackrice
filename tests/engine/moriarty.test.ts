import { describe, expect, it } from "vitest";
import { CASE_01 } from "@/lib/cases/case-01";
import {
  MORIARTY_NONE_OPTION_ID,
  buildMoriartyPlan,
  judgeMoriartyDefense,
} from "@/lib/engine/moriarty";

describe("deterministic Moriarty challenge", () => {
  it("accepts any independently rooted pinned exhibit as a valid defense", () => {
    const plan = buildMoriartyPlan(CASE_01, ["offer-email", "official-directory"]);

    expect(plan.kind).toBe("defend_independence");
    expect(plan.correctOptionIds).toEqual(["official-directory"]);
    expect(judgeMoriartyDefense(plan, "official-directory")).toEqual({
      correct: true,
      outcome: "chain_held",
    });
    expect(judgeMoriartyDefense(plan, "offer-email")).toEqual({
      correct: false,
      outcome: "moriarty_prevailed",
    });
  });

  it("rewards recognizing that a claimant-only chain has no independent exhibit", () => {
    const plan = buildMoriartyPlan(CASE_01, ["offer-email", "supplied-call"]);

    expect(plan.kind).toBe("expose_shared_source");
    expect(judgeMoriartyDefense(plan, MORIARTY_NONE_OPTION_ID)).toEqual({
      correct: true,
      outcome: "weakness_spotted",
    });
  });

  it("handles an empty chain without inventing proof", () => {
    const plan = buildMoriartyPlan(CASE_01, []);

    expect(plan.kind).toBe("empty_chain");
    expect(plan.options).toHaveLength(1);
    expect(judgeMoriartyDefense(plan, MORIARTY_NONE_OPTION_ID).correct).toBe(true);
  });

  it("rejects unknown, duplicate, and oversized pinned lists", () => {
    expect(() => buildMoriartyPlan(CASE_01, ["unknown"])).toThrow();
    expect(() => buildMoriartyPlan(CASE_01, ["offer-email", "offer-email"])).toThrow();
    expect(() =>
      buildMoriartyPlan(CASE_01, [
        "offer-email",
        "supplied-call",
        "supplied-staff-page",
        "official-directory",
      ]),
    ).toThrow();
  });
});
