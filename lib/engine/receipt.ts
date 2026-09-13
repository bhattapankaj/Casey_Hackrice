import type { CaseFile } from "@/lib/cases/schema";
import { selectPinnedArtifacts } from "@/lib/engine/selectors";
import type { GameSession, ScoreBreakdown, ScoreReceipt } from "@/lib/engine/types";
import { PRESSURE_TACTIC_COPY } from "@/lib/voice/pressure-tactics";

function summaryFor(score: ScoreBreakdown, receipt: Omit<ScoreReceipt, "summary">): string {
  if (score.verdict.earned === 400 && receipt.pinnedArtifacts.length === 0) {
    return "Right verdict, weak chain. In real life, a guess is not protection.";
  }
  if (score.independence.explanationKey === "independence.decisive") {
    return "You left their channel and found a source they did not control.";
  }
  if (receipt.truth === "legit" && score.verdict.earned === 400) {
    return "Trust was earned through an independent route, not assumed from polish.";
  }
  if (receipt.truth === "not_enough_evidence" && score.verdict.earned === 400) {
    return "Stopping is a valid verdict when proof is missing.";
  }
  if (
    receipt.pinnedArtifacts.length > 1 &&
    receipt.sourceBranches.length === 1 &&
    receipt.sourceBranches[0].sourceClass === "claimant"
  ) {
    return "Three confirmations. One source.";
  }
  if (score.verdict.earned === 0) {
    return "The verdict did not match the authored evidence.";
  }
  return "Your Receipt shows where every pinned confirmation actually came from.";
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value;
}

export function buildReceipt(
  caseFile: CaseFile,
  session: GameSession,
  score: ScoreBreakdown,
): ScoreReceipt {
  if (session.verdict === undefined) {
    throw new Error("A verdict must be committed before building a Receipt");
  }
  const pinnedArtifacts = selectPinnedArtifacts(caseFile, session).map((artifact, index) => ({
    id: artifact.id,
    title: artifact.title,
    channel: artifact.channel,
    sourceRoot: artifact.sourceRoot,
    sourceRootLabel: artifact.sourceRootLabel,
    sourceClass: artifact.sourceClass,
    pinOrder: index + 1,
  }));
  const sourceBranches = pinnedArtifacts.reduce<ScoreReceipt["sourceBranches"]>(
    (branches, artifact) => {
      const existing = branches.find((branch) => branch.sourceRoot === artifact.sourceRoot);
      if (existing) {
        existing.artifactIds.push(artifact.id);
      } else {
        branches.push({
          sourceRoot: artifact.sourceRoot,
          sourceRootLabel: artifact.sourceRootLabel,
          sourceClass: artifact.sourceClass,
          artifactIds: [artifact.id],
        });
      }
      return branches;
    },
    [],
  );
  const pressureCards = session.pressureTactics.map((tactic) => ({
    tactic,
    ...PRESSURE_TACTIC_COPY[tactic],
  }));
  const receiptWithoutSummary = {
    caseId: caseFile.id,
    caseTitle: caseFile.shortTitle,
    truth: caseFile.truth,
    selectedVerdict: session.verdict,
    score,
    pinnedArtifacts,
    sourceBranches,
    pressureCards,
    lesson: caseFile.debrief.lesson,
    realWorldAction: caseFile.debrief.realWorldAction,
    sourceUrl: caseFile.debrief.sourceUrl,
    sourceLabel: caseFile.debrief.sourceLabel,
    sourceNote: caseFile.sourceNote,
  };
  return deepFreeze({
    ...receiptWithoutSummary,
    summary: summaryFor(score, receiptWithoutSummary),
  });
}
