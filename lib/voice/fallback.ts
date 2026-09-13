import type { PressureTactic } from "@/lib/cases/schema";

export type FallbackBeat = {
  id: string;
  speaker: "caller" | "casey";
  text: string;
  tactic?: PressureTactic;
};

const CASE_01_BEATS: readonly FallbackBeat[] = [
  {
    id: "opening",
    speaker: "caller",
    text: "Hi, this is Morgan from Meridian. We need your answer today so the research role is not reassigned.",
    tactic: "urgency",
  },
  {
    id: "authority",
    speaker: "caller",
    text: "The group works with Harlow University, so this is already cleared through the institution.",
    tactic: "authority",
  },
  {
    id: "casey-prompt",
    speaker: "casey",
    text: "The caller sounds confident. Investigate the offer through a source the claimant did not provide.",
  },
];

export function getFallbackBeats(caseId: string): readonly FallbackBeat[] {
  return caseId === "case-01" ? CASE_01_BEATS : [];
}
