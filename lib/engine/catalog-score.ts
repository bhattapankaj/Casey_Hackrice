import { sourceClassToBand } from "@/lib/cases/public-case";
import type { CaseFile } from "@/lib/cases/schema";
import { selectPinnedArtifacts } from "@/lib/engine/selectors";
import type { GameSession } from "@/lib/engine/types";

export const CORRECT_VERDICT = 100;
export const OUT_OF_BAND_BONUS = 50;
export const IN_BAND_ONLY_PENALTY = 25;

export type CatalogRoundScore = {
  total: number;
  correct: boolean;
  usedOutOfBand: boolean;
};

export function scoreCatalogRound(
  caseFile: CaseFile,
  session: GameSession,
): CatalogRoundScore {
  const verdict = session.verdict;
  const pinned = selectPinnedArtifacts(caseFile, session);
  const usedOutOfBand = pinned.some((artifact) => sourceClassToBand(artifact.sourceClass) === "out");
  const onlyInBand =
    pinned.length > 0 &&
    pinned.every((artifact) => sourceClassToBand(artifact.sourceClass) === "in");

  if (!verdict) {
    return { total: 0, correct: false, usedOutOfBand };
  }

  const correct = verdict === caseFile.truth;
  if (!correct) {
    return { total: 0, correct: false, usedOutOfBand };
  }

  let total = CORRECT_VERDICT;
  if (usedOutOfBand) {
    total += OUT_OF_BAND_BONUS;
  }
  const unresolvable = caseFile.truth === "not_enough_evidence";
  if (onlyInBand && !unresolvable && (verdict === "scam" || verdict === "legit")) {
    total -= IN_BAND_ONLY_PENALTY;
  }

  return { total: Math.max(0, total), correct: true, usedOutOfBand };
}
