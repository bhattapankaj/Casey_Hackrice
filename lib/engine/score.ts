import type { CaseFile, Verdict } from "@/lib/cases/schema";
import { selectCompletedActions, selectPinnedArtifacts } from "@/lib/engine/selectors";
import type { GameSession, ScoreBreakdown, ScoreExplanationKey } from "@/lib/engine/types";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function independenceScore(
  caseFile: CaseFile,
  session: GameSession,
  verdict: Verdict | undefined,
): { earned: number; explanationKey: ScoreExplanationKey } {
  if (!verdict) {
    return { earned: 0, explanationKey: "independence.none" };
  }

  if (caseFile.truth === "not_enough_evidence" && verdict === caseFile.truth) {
    const attemptedUnresolvedCheck = selectCompletedActions(caseFile, session).some(
      (action) =>
        action.sourceClass === "independent" &&
        action.reveals.length > 0 &&
        action.reveals.every((artifactId) => {
          const artifact = caseFile.artifacts.find((candidate) => candidate.id === artifactId);
          return artifact !== undefined && !artifact.decisive;
        }),
    );
    return attemptedUnresolvedCheck
      ? { earned: 300, explanationKey: "independence.unresolved_check" }
      : { earned: 0, explanationKey: "independence.none" };
  }

  const supportingPins = selectPinnedArtifacts(caseFile, session).filter((artifact) =>
    artifact.supports.includes(verdict),
  );
  if (
    supportingPins.some(
      (artifact) => artifact.sourceClass === "independent" && artifact.decisive,
    )
  ) {
    return { earned: 300, explanationKey: "independence.decisive" };
  }
  if (supportingPins.some((artifact) => artifact.sourceClass === "independent")) {
    return { earned: 150, explanationKey: "independence.corroborative" };
  }
  if (supportingPins.some((artifact) => artifact.sourceClass === "claimant")) {
    return { earned: 0, explanationKey: "independence.claimant_only" };
  }
  return { earned: 0, explanationKey: "independence.none" };
}

export function scoreSession(caseFile: CaseFile, session: GameSession): ScoreBreakdown {
  const selectedVerdict = session.verdict;
  const verdictEarned = selectedVerdict === caseFile.truth ? 400 : 0;
  const independence = independenceScore(caseFile, session, selectedVerdict);
  const pinned = selectPinnedArtifacts(caseFile, session);
  const supportingWeight = selectedVerdict
    ? pinned
        .filter((artifact) => artifact.supports.includes(selectedVerdict))
        .reduce((total, artifact) => total + artifact.evidenceWeight, 0)
    : 0;
  const contradictions = selectedVerdict
    ? pinned.filter((artifact) => artifact.contradicts?.includes(selectedVerdict)).length
    : 0;
  const evidenceEarned = clamp(supportingWeight - contradictions * 50, 0, 200);
  const riskCost = selectCompletedActions(caseFile, session).reduce(
    (total, action) => total + action.riskCost,
    0,
  );
  const composureEarned = clamp(100 - riskCost, 0, 100);

  const evidenceExplanation: ScoreExplanationKey =
    pinned.length === 0
      ? "evidence.none"
      : contradictions > 0
        ? "evidence.mixed"
        : "evidence.supporting";
  const score: ScoreBreakdown = {
    verdict: {
      earned: verdictEarned,
      maximum: 400,
      explanationKey:
        selectedVerdict === undefined
          ? "verdict.missing"
          : verdictEarned === 400
            ? "verdict.correct"
            : "verdict.incorrect",
    },
    independence: {
      earned: independence.earned,
      maximum: 300,
      explanationKey: independence.explanationKey,
    },
    evidenceQuality: {
      earned: evidenceEarned,
      maximum: 200,
      explanationKey: evidenceExplanation,
    },
    composure: {
      earned: composureEarned,
      maximum: 100,
      explanationKey: riskCost === 0 ? "composure.full" : "composure.reduced",
    },
    total: verdictEarned + independence.earned + evidenceEarned + composureEarned,
    maximum: 1000,
  };
  return score;
}
