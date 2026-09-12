import type { Band, Channel } from "@/lib/channels";

export type CaseTruth = "scam" | "legit" | "unresolvable";
export type Verdict = "scam" | "legit" | "more";

export type Scoring = {
  correctVerdict: number;
  outOfBandBonus: number;
  inBandOnlyPenalty: number;
  wrongVerdict: number;
};

export const DEFAULT_SCORING: Scoring = {
  correctVerdict: 100,
  outOfBandBonus: 50,
  inBandOnlyPenalty: -25,
  wrongVerdict: 0,
};

export type CaseContract = {
  id: string;
  title: string;
  truth: CaseTruth;
  briefing: string;
  artifacts: {
    id: string;
    channel: Channel;
    band: Band;
    content: string;
    unlockedBy?: string;
  }[];
  debrief: {
    lesson: string;
    realWorldLink: string;
  };
};
