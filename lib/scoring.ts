import type { CaseArtifact, GameCase, Verdict } from "@/lib/cases";

export type ScoreLine = {
  ok: boolean;
  text: string;
  delta: number;
};

export type ReceiptModel = {
  summary: string;
  lines: ScoreLine[];
  delta: number;
  total: number;
  lesson: string;
  realWorldLink: string;
  realWorldLabel: string;
};

export function buildReceipt(
  gameCase: GameCase,
  verdict: Verdict,
  opened: CaseArtifact[],
  baseScore = gameCase.startingScore,
): ReceiptModel {
  const inBand = opened.filter((artifact) => artifact.band === "in").length;
  const outBand = opened.filter((artifact) => artifact.band === "out").length;
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

    if (outBand >= 1) {
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

    if (opened.length > 0 && outBand === 0) {
      lines.push({
        ok: false,
        text: "The confirmations you used came from their own channel.",
        delta: 0,
      });
    }
  }

  let summary: string;

  if (opened.length === 0) {
    summary = "You decided before you had opened a single card.";
  } else if (opened.length === 1) {
    const only = opened[0];
    summary =
      only.band === "in"
        ? "Your only confirmation came through their own channel."
        : "Your only confirmation was found independently.";
  } else if (inBand === 0) {
    summary = "Every confirmation you used was found independently.";
  } else if (outBand === 0) {
    summary = "Every confirmation came through their own channel.";
  } else if (inBand === 2 && opened.length === 3) {
    summary = "Two of your three confirmations came through their own channel.";
  } else {
    const words = ["zero", "one", "two", "three", "four"];
    const inWord = words[inBand] ?? String(inBand);
    const totalWord = words[opened.length] ?? String(opened.length);
    summary = `${inWord.charAt(0).toUpperCase()}${inWord.slice(1)} of your ${totalWord} confirmations came through their own channel.`;
  }

  return {
    summary,
    lines,
    delta,
    total: baseScore + delta,
    lesson: gameCase.debrief.lesson,
    realWorldLink: gameCase.debrief.realWorldLink,
    realWorldLabel: gameCase.debrief.realWorldLabel,
  };
}

