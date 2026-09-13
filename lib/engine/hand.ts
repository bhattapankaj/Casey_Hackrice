export const HANDS = [
  "High card",
  "Pair",
  "Two pair",
  "Flush",
  "Royal flush",
] as const;

export type Hand = (typeof HANDS)[number];

export type HandInput = {
  correct: boolean;
  outOfBandPinned: number;
  inBandPinned: number;
  firstAttempt: boolean;
};

export function handRankValue(hand: Hand): number {
  return HANDS.indexOf(hand);
}

export function isBetterHand(candidate: Hand, current: Hand | null): boolean {
  if (!current) return true;
  return handRankValue(candidate) > handRankValue(current);
}

export function rankHand(r: HandInput): Hand {
  if (!r.correct || r.outOfBandPinned === 0) {
    return "High card";
  }
  if (r.outOfBandPinned === 1) {
    return "Pair";
  }
  if (r.outOfBandPinned === 2) {
    return "Two pair";
  }
  if (r.outOfBandPinned >= 3 && r.inBandPinned === 0) {
    return r.firstAttempt ? "Royal flush" : "Flush";
  }
  // Three-plus out-of-band with any in-band still beats two pair, but is not a flush.
  return "Two pair";
}

export function explainHand(hand: Hand, correct: boolean): string {
  if (hand === "Royal flush") {
    return "First attempt, three independent sources, and none from their channel.";
  }
  if (hand === "Flush") {
    return "Three or more independent sources, and none from their channel.";
  }
  if (hand === "Two pair") {
    return "Two independent sources held.";
  }
  if (hand === "Pair") {
    return "One independent source held.";
  }
  if (correct) {
    return "Correct, but every source traced back to them.";
  }
  return "The verdict did not match the authored truth.";
}

export function compareHands(a: Hand | null | undefined, b: Hand | null | undefined): number {
  return handRankValue(b ?? "High card") - handRankValue(a ?? "High card");
}
