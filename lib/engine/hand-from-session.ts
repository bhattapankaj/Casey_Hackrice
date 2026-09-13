import { sourceClassToBand } from "@/lib/cases/public-case";
import type { CaseFile } from "@/lib/cases/schema";
import { explainHand, rankHand, type Hand } from "@/lib/engine/hand";
import type { GameSession } from "@/lib/engine/types";

export type HandTally = {
  outOfBandPinned: number;
  inBandPinned: number;
};

export function tallyPinnedBands(caseFile: CaseFile, session: GameSession): HandTally {
  let outOfBandPinned = 0;
  let inBandPinned = 0;
  for (const id of session.pinnedArtifactIds) {
    const artifact = caseFile.artifacts.find((entry) => entry.id === id);
    if (!artifact) continue;
    const band = sourceClassToBand(artifact.sourceClass);
    if (band === "out") outOfBandPinned += 1;
    if (band === "in") inBandPinned += 1;
  }
  return { outOfBandPinned, inBandPinned };
}

export function handForRound(
  caseFile: CaseFile,
  session: GameSession,
  correct: boolean,
  firstAttempt: boolean,
): { hand: Hand; explanation: string; tallies: HandTally } {
  const tallies = tallyPinnedBands(caseFile, session);
  const hand = rankHand({
    correct,
    outOfBandPinned: tallies.outOfBandPinned,
    inBandPinned: tallies.inBandPinned,
    firstAttempt,
  });
  return { hand, explanation: explainHand(hand, correct), tallies };
}
