import type { Verdict } from "@/lib/cases/schema";
import type { ScoreReceipt } from "@/lib/engine/types";

const VERDICT_LABELS: Record<Verdict, string> = {
  scam: "Scam",
  legit: "Legitimate",
  not_enough_evidence: "Not enough evidence",
};

export function chainWasIndependent(
  receipt: Pick<ScoreReceipt, "sourceBranches">,
): boolean {
  return receipt.sourceBranches.some(
    (branch) => branch.sourceClass === "independent" && branch.artifactIds.length > 0,
  );
}

export function buildShareText(
  receipt: Pick<ScoreReceipt, "caseId" | "caseTitle" | "selectedVerdict" | "sourceBranches">,
  origin: string,
): string {
  const verdict = VERDICT_LABELS[receipt.selectedVerdict];
  const chain = chainWasIndependent(receipt)
    ? "Independent chain."
    : "No independent chain.";
  const url = `${origin.replace(/\/$/, "")}/play/${receipt.caseId}`;
  return `${receipt.caseTitle}\n${verdict}. ${chain}\n${url}`;
}
