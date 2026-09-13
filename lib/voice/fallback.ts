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

const CASE_02_BEATS: readonly FallbackBeat[] = [
  {
    id: "opening",
    speaker: "caller",
    text: "This is Drew with Harborline fraud. A $2,400 transfer is pending and the hold will not last if you leave.",
    tactic: "urgency",
  },
  {
    id: "authority",
    speaker: "caller",
    text: "I am on the fraud desk. The secure page shows the same transfer if you want to look while we talk.",
    tactic: "authority",
  },
  {
    id: "casey-prompt",
    speaker: "casey",
    text: "The alert and the voice agree. Check Harborline through a number that did not come from this caller.",
  },
];

const CASE_03_BEATS: readonly FallbackBeat[] = [
  {
    id: "opening",
    speaker: "caller",
    text: "Hi, this is Len from Student Employment. I still have Thursday at the Hale Hall desk if you want it.",
    tactic: "reciprocity",
  },
  {
    id: "urgency",
    speaker: "caller",
    text: "Sorry, I know this is last minute. I just need a yes or no so I can stop emailing the backup list.",
    tactic: "urgency",
  },
  {
    id: "casey-prompt",
    speaker: "casey",
    text: "The caller sounds unsure. That is not a verdict. Check the shift on a listing you found yourself.",
  },
];

const BEATS: Record<string, readonly FallbackBeat[]> = {
  "case-01": CASE_01_BEATS,
  "case-02": CASE_02_BEATS,
  "case-03": CASE_03_BEATS,
};

export function getFallbackBeats(caseId: string): readonly FallbackBeat[] {
  return BEATS[caseId] ?? [];
}
