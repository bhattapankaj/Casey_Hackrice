import type { CaseFile, SourceClass } from "@/lib/cases/schema";
import type { ReceiptArtifact } from "@/lib/engine/types";

export const MORIARTY_NONE_OPTION_ID = "no-independent-exhibit";

export type MoriartyChallengeKind =
  | "defend_independence"
  | "expose_shared_source"
  | "empty_chain";

export type MoriartyOption = {
  id: string;
  label: string;
  sourceRootLabel: string;
  sourceClass: SourceClass;
};

export type MoriartyChallengePlan = {
  caseId: string;
  caseTitle: string;
  kind: MoriartyChallengeKind;
  focusArtifactId: string | null;
  correctOptionIds: string[];
  options: MoriartyOption[];
};

type ChallengeArtifact = Pick<
  ReceiptArtifact,
  "id" | "title" | "sourceRootLabel" | "sourceClass"
>;

export type MoriartyDefenseResult = {
  correct: boolean;
  outcome: "chain_held" | "weakness_spotted" | "moriarty_prevailed";
};

export function buildMoriartyPlanFromArtifacts(
  caseId: string,
  caseTitle: string,
  artifacts: ChallengeArtifact[],
): MoriartyChallengePlan {
  const uniqueArtifacts = artifacts.filter(
    (artifact, index) => artifacts.findIndex((candidate) => candidate.id === artifact.id) === index,
  );
  const independent = uniqueArtifacts.filter(
    (artifact) => artifact.sourceClass === "independent",
  );
  const kind: MoriartyChallengeKind =
    uniqueArtifacts.length === 0
      ? "empty_chain"
      : independent.length > 0
        ? "defend_independence"
        : "expose_shared_source";

  return {
    caseId,
    caseTitle,
    kind,
    focusArtifactId:
      kind === "defend_independence"
        ? independent[0]?.id ?? null
        : uniqueArtifacts[0]?.id ?? null,
    correctOptionIds:
      independent.length > 0
        ? independent.map((artifact) => artifact.id)
        : [MORIARTY_NONE_OPTION_ID],
    options: [
      ...uniqueArtifacts.map((artifact) => ({
        id: artifact.id,
        label: artifact.title,
        sourceRootLabel: artifact.sourceRootLabel,
        sourceClass: artifact.sourceClass,
      })),
      {
        id: MORIARTY_NONE_OPTION_ID,
        label: "No pinned exhibit is independent",
        sourceRootLabel: "No separate source root",
        sourceClass: "unknown" as const,
      },
    ],
  };
}

export function buildMoriartyPlan(
  caseFile: CaseFile,
  pinnedArtifactIds: string[],
): MoriartyChallengePlan {
  if (pinnedArtifactIds.length > 3 || new Set(pinnedArtifactIds).size !== pinnedArtifactIds.length) {
    throw new Error("Pinned artifact ids must be unique and capped at three");
  }

  const artifacts = pinnedArtifactIds.map((artifactId) => {
    const artifact = caseFile.artifacts.find((candidate) => candidate.id === artifactId);
    if (!artifact) {
      throw new Error("Pinned artifact id does not belong to the case");
    }
    return artifact;
  });

  return buildMoriartyPlanFromArtifacts(caseFile.id, caseFile.shortTitle, artifacts);
}

export function judgeMoriartyDefense(
  plan: MoriartyChallengePlan,
  selectedOptionId: string,
): MoriartyDefenseResult {
  const optionExists = plan.options.some((option) => option.id === selectedOptionId);
  const correct = optionExists && plan.correctOptionIds.includes(selectedOptionId);

  if (!correct) {
    return { correct: false, outcome: "moriarty_prevailed" };
  }

  return {
    correct: true,
    outcome:
      plan.kind === "defend_independence" ? "chain_held" : "weakness_spotted",
  };
}
