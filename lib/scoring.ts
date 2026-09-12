import {
  TRUTH_LABEL,
  VERDICT_LABEL,
  type CaseArtifact,
  type GameCase,
  type Verdict,
} from "@/lib/cases";
import type { Band } from "@/lib/channels";

export type ScoreLine = {
  ok: boolean;
  text: string;
  delta: number;
};

/** Artifacts that trace back to the same origin, shown together on the receipt. */
export type SourceGroup = {
  id: string;
  label: string;
  band: Band;
  artifacts: CaseArtifact[];
};

export type ReceiptModel = {
  verdictLabel: string;
  truthLabel: string;
  correct: boolean;
  summary: string;
  groups: SourceGroup[];
  claimantCount: number;
  independentCount: number;
  lines: ScoreLine[];
  /** Points from this case alone. */
  delta: number;
  /** Score across the whole run, after this case. */
  total: number;
  independentFinding: string;
  independentLimit: string;
  lesson: string;
  habit: string;
  realWorldLink: string;
  realWorldLabel: string;
};

export function groupBySource(opened: CaseArtifact[]): SourceGroup[] {
  const groups: SourceGroup[] = [];
  for (const artifact of opened) {
    const existing = groups.find((group) => group.id === artifact.sourceId);
    if (existing) {
      existing.artifacts.push(artifact);
    } else {
      groups.push({
        id: artifact.sourceId,
        label: artifact.sourceLabel,
        band: artifact.band,
        artifacts: [artifact],
      });
    }
  }
  // Claimant-rooted groups read first, since that is the trap being taught.
  return groups.sort((a, b) => (a.band === b.band ? 0 : a.band === "in" ? -1 : 1));
}

function describeCoverage(
  opened: CaseArtifact[],
  claimantCount: number,
  independentCount: number,
): string {
  if (opened.length === 0) {
    return "You decided before you had opened a single card.";
  }
  if (independentCount === 0) {
    return opened.length === 1
      ? "Your only check stayed inside their own channel."
      : "Every check you made stayed inside their own channel.";
  }
  if (claimantCount === 0) {
    return opened.length === 1
      ? "Your only check was one you found yourself."
      : "Every check you made was one you found yourself.";
  }
  const words = ["zero", "one", "two", "three", "four", "five"];
  const claimed = words[claimantCount] ?? String(claimantCount);
  const total = words[opened.length] ?? String(opened.length);
  return `${claimed.charAt(0).toUpperCase()}${claimed.slice(1)} of your ${total} checks came through their own channel.`;
}

export function buildReceipt(
  gameCase: GameCase,
  verdict: Verdict,
  opened: CaseArtifact[],
  baseScore = gameCase.startingScore,
): ReceiptModel {
  const claimantCount = opened.filter((a) => a.band === "in").length;
  const independentCount = opened.filter((a) => a.band === "out").length;
  const lines: ScoreLine[] = [];
  let delta = 0;

  const correct =
    (verdict === "scam" && gameCase.truth === "scam") ||
    (verdict === "legit" && gameCase.truth === "legit") ||
    (verdict === "more" && gameCase.truth === "unresolvable");

  if (opened.length === 0) {
    lines.push({
      ok: false,
      text: "You called a verdict before opening any evidence.",
      delta: 0,
    });
  } else if (correct) {
    lines.push({
      ok: true,
      text: `Correct verdict on ${gameCase.shortTitle}.`,
      delta: 100,
    });
    delta += 100;

    if (independentCount >= 1) {
      lines.push({
        ok: true,
        text: "At least one confirmation was found independently.",
        delta: 50,
      });
      delta += 50;
    } else {
      lines.push({
        ok: false,
        text: "Every check you made stayed on their channel.",
        delta: -25,
      });
      delta -= 25;
    }
  } else {
    lines.push({
      ok: false,
      text: "The verdict did not match what the evidence showed.",
      delta: 0,
    });

    if (independentCount === 0) {
      lines.push({
        ok: false,
        text: "The confirmations you used came from their own channel.",
        delta: 0,
      });
    }
  }

  return {
    verdictLabel: VERDICT_LABEL[verdict],
    truthLabel: TRUTH_LABEL[gameCase.truth],
    correct,
    summary: describeCoverage(opened, claimantCount, independentCount),
    groups: groupBySource(opened),
    claimantCount,
    independentCount,
    lines,
    delta,
    total: baseScore + delta,
    independentFinding: gameCase.debrief.independentFinding,
    independentLimit: gameCase.debrief.independentLimit,
    lesson: gameCase.debrief.lesson,
    habit: gameCase.debrief.habit,
    realWorldLink: gameCase.debrief.realWorldLink,
    realWorldLabel: gameCase.debrief.realWorldLabel,
  };
}
