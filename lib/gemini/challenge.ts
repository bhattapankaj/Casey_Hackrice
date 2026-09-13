import type { MoriartyChallengePlan } from "@/lib/engine/moriarty";

export type MoriartyCopy = {
  objection: string;
  question: string;
  successLine: string;
  failureLine: string;
};

export type MoriartyCopyResponse = {
  source: "gemini" | "fallback";
  copy: MoriartyCopy;
};

const COPY_KEYS = ["objection", "question", "successLine", "failureLine"] as const;
const MAX_LENGTHS: Record<(typeof COPY_KEYS)[number], number> = {
  objection: 220,
  question: 160,
  successLine: 180,
  failureLine: 180,
};
const FORBIDDEN_COPY =
  /\b(?:password|passcode|security code|social security|government id|bank account|routing number|credit card|send money|wire money|date of birth|home address|phone number|email address)\b/i;

function cleanLine(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/[\u2013\u2014]/g, ", ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (
    cleaned.length < 8 ||
    cleaned.length > maximum ||
    /https?:\/\/|www\.|<\/?[a-z][^>]*>/i.test(cleaned) ||
    FORBIDDEN_COPY.test(cleaned)
  ) {
    return null;
  }
  return cleaned;
}

export function parseMoriartyCopy(value: unknown): MoriartyCopy | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    Object.keys(candidate).some((key) => !COPY_KEYS.includes(key as (typeof COPY_KEYS)[number]))
  ) {
    return null;
  }

  const copy = Object.fromEntries(
    COPY_KEYS.map((key) => [key, cleanLine(candidate[key], MAX_LENGTHS[key])]),
  ) as Record<(typeof COPY_KEYS)[number], string | null>;

  return COPY_KEYS.every((key) => copy[key] !== null) ? (copy as MoriartyCopy) : null;
}

export function parseMoriartyCopyResponse(value: unknown): MoriartyCopyResponse | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const copy = parseMoriartyCopy(candidate.copy);
  if ((candidate.source !== "gemini" && candidate.source !== "fallback") || !copy) return null;
  return { source: candidate.source, copy };
}

export function fallbackMoriartyCopy(plan: MoriartyChallengePlan): MoriartyCopy {
  if (plan.kind === "defend_independence") {
    return {
      objection:
        "Several exhibits lie on this table, detective, but quantity often disguises dependence.",
      question: "Which pinned exhibit came from a source the claimant did not control?",
      successLine: "A separate source root. Your chain survives my objection this time.",
      failureLine: "You followed the thread back into the claimant's own hand.",
    };
  }

  if (plan.kind === "expose_shared_source") {
    return {
      objection:
        "Different cards and different channels, yet every thread may return to the same hand.",
      question: "Which pinned exhibit proves that you reached an independent source?",
      successLine: "You spotted the trap. Conceding weak proof is stronger than defending it.",
      failureLine: "A new channel is not a new source. Your chain folds under inspection.",
    };
  }

  return {
    objection: "An empty evidence chain gives even the finest detective nothing to defend.",
    question: "Which option describes the proof currently on the table?",
    successLine: "Precisely. You cannot defend evidence that was never pinned.",
    failureLine: "Confidence without a pinned exhibit is merely a wager.",
  };
}

export function fallbackMoriartyResponse(
  plan: MoriartyChallengePlan,
): MoriartyCopyResponse {
  return { source: "fallback", copy: fallbackMoriartyCopy(plan) };
}
