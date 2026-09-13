import { describe, expect, it } from "vitest";
import { CASE_01 } from "@/lib/cases/case-01";
import { CASE_02 } from "@/lib/cases/case-02";
import { CASE_03 } from "@/lib/cases/case-03";
import { getEnabledCases } from "@/lib/cases/registry";
import { buildReceipt } from "@/lib/engine/receipt";
import { createInitialSession, reduceSession } from "@/lib/engine/reducer";
import { scoreSession } from "@/lib/engine/score";
import { validateCase } from "@/lib/engine/validate-case";

describe("sourceNote documented pattern", () => {
  it("requires a real HTTPS URL, year, and two sentences on every shipped case", () => {
    for (const caseFile of getEnabledCases()) {
      expect(caseFile.sourceNote.year).toBeGreaterThanOrEqual(2000);
      expect(caseFile.sourceNote.url.startsWith("https://")).toBe(true);
      expect(caseFile.sourceNote.pattern.match(/[.!?](\s|$)/g)?.length).toBe(2);
      expect(caseFile.sourceNote.pattern).not.toMatch(/\bprevented\b|\bsaved\b/i);
      expect(validateCase(caseFile).sourceNote.url).toBe(caseFile.sourceNote.url);
    }
  });

  it("puts the jobs and bank figures on the Receipt without assigning them to the fictional victim", () => {
    const session = reduceSession(
      CASE_01,
      createInitialSession(CASE_01, "2026-09-13T00:00:00.000Z"),
      { type: "COMMIT_VERDICT", verdict: "scam", at: "2026-09-13T00:01:00.000Z" },
    );
    const receipt = buildReceipt(CASE_01, session, scoreSession(CASE_01, session));
    expect(receipt.sourceNote).toEqual(CASE_01.sourceNote);
    expect(receipt.sourceNote.pattern).toContain("$90 million");
    expect(receipt.sourceNote.pattern).toContain("$501 million");
    expect(CASE_02.sourceNote.pattern).toContain("$700");
    expect(CASE_02.sourceNote.pattern).not.toContain("$3.5");
    expect(CASE_03.sourceNote.pattern).toContain("$90 million");
  });

  it("rejects a pattern that is not two sentences", () => {
    const candidate = structuredClone(CASE_01);
    candidate.sourceNote.pattern = "Only one sentence.";
    expect(() => validateCase(candidate)).toThrow(/two sentences/);
  });
});
