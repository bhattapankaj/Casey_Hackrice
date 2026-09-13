import { describe, expect, it } from "vitest";
import { CASE_01 } from "@/lib/cases/case-01";
import { getEnabledCases } from "@/lib/cases/registry";
import { CaseSchemaError } from "@/lib/cases/schema";
import {
  CaseValidationError,
  validateCase,
  validateCaseRegistry,
} from "@/lib/engine/validate-case";

type MutableCaseFixture = {
  truth: unknown;
  startingArtifactIds: string[];
  artifacts: Array<{
    id: string;
    sourceClass: unknown;
    channel: unknown;
    evidenceWeight: unknown;
    decisive: boolean;
    unlockedBy?: string;
  }>;
  actions: Array<{
    id: string;
    reveals: string[];
    riskCost: unknown;
  }>;
  allowedPressureTactics: unknown[];
  caller: { maxCallSeconds: number; offerSummary: string };
  debrief: { sourceUrl: string };
};

function copyCase(): MutableCaseFixture {
  return structuredClone(CASE_01) as unknown as MutableCaseFixture;
}

describe("Case 01 validation", () => {
  it("registers only the complete Meridian Offer fixture", () => {
    expect(validateCase(CASE_01)).toEqual(CASE_01);
    expect(getEnabledCases().map((caseFile) => caseFile.id)).toEqual(["case-01"]);
  });

  it("rejects duplicate case, artifact, and action IDs", () => {
    expect(() => validateCaseRegistry([CASE_01, CASE_01])).toThrow(/Duplicate case ID/);

    const artifactDuplicate = copyCase();
    artifactDuplicate.artifacts[1].id = artifactDuplicate.artifacts[0].id;
    expect(() => validateCase(artifactDuplicate)).toThrow(/Duplicate artifact ID/);

    const actionDuplicate = copyCase();
    actionDuplicate.actions[1].id = actionDuplicate.actions[0].id;
    expect(() => validateCase(actionDuplicate)).toThrow(/Duplicate action ID/);
  });

  it("rejects missing reveal, unlock, and starting references", () => {
    const badReveal = copyCase();
    badReveal.actions[0].reveals = ["missing-artifact"];
    expect(() => validateCase(badReveal)).toThrow(/Unknown revealed artifact/);

    const badUnlock = copyCase();
    badUnlock.artifacts[1].unlockedBy = "missing-action";
    expect(() => validateCase(badUnlock)).toThrow(/Unknown unlock action/);

    const badStarting = copyCase();
    badStarting.startingArtifactIds = ["missing-artifact"];
    expect(() => validateCase(badStarting)).toThrow(/Unknown starting artifact/);
  });

  it.each([
    ["truth", (candidate: MutableCaseFixture) => (candidate.truth = "maybe")],
    ["source class", (candidate: MutableCaseFixture) => (candidate.artifacts[0].sourceClass = "external")],
    ["channel", (candidate: MutableCaseFixture) => (candidate.artifacts[0].channel = "fax")],
    ["tactic", (candidate: MutableCaseFixture) => (candidate.allowedPressureTactics[0] = "fear")],
    ["weight", (candidate: MutableCaseFixture) => (candidate.artifacts[0].evidenceWeight = 30)],
    ["risk cost", (candidate: MutableCaseFixture) => (candidate.actions[0].riskCost = 10)],
  ])("rejects an invalid %s", (_label, mutate) => {
    const candidate = copyCase();
    mutate(candidate);
    expect(() => validateCase(candidate)).toThrow(CaseSchemaError);
  });

  it("rejects duplicated tactics and overlong calls", () => {
    const duplicatedTactic = copyCase();
    duplicatedTactic.allowedPressureTactics = ["urgency", "urgency"];
    expect(() => validateCase(duplicatedTactic)).toThrow(/Duplicate pressure tactic/);

    const overlong = copyCase();
    overlong.caller.maxCallSeconds = 76;
    expect(() => validateCase(overlong)).toThrow(/cannot exceed 75 seconds/);
  });

  it("rejects unsafe debrief URLs and unsafe voice variables", () => {
    const unsafeUrl = copyCase();
    unsafeUrl.debrief.sourceUrl = "http://example.com/advice";
    expect(() => validateCase(unsafeUrl)).toThrow(/approved HTTPS source/);

    const secret = copyCase();
    secret.caller.offerSummary = "Use ELEVENLABS_API_KEY in this prompt";
    expect(() => validateCase(secret)).toThrow(/secret or scoring\/truth instruction/);
  });

  it("requires decisive independent scam evidence for Case 01", () => {
    const candidate = copyCase();
    const decisive = candidate.artifacts.find((artifact) => artifact.id === "directory-call")!;
    decisive.decisive = false;
    expect(() => validateCase(candidate)).toThrow(CaseValidationError);
    expect(() => validateCase(candidate)).toThrow(/decisive independent evidence/);
  });

  it("rejects inconsistent metadata for the same source root", () => {
    const candidate = copyCase();
    candidate.artifacts[1].sourceClass = "independent";
    expect(() => validateCase(candidate)).toThrow(/inconsistent provenance metadata/);
  });
});
