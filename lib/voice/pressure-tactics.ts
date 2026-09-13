import { PRESSURE_TACTICS, type PressureTactic } from "@/lib/cases/schema";

export const PRESSURE_TACTIC_COPY: Record<
  PressureTactic,
  { label: string; explanation: string; counterAction: string }
> = {
  urgency: {
    label: "Urgency",
    explanation: "The caller made delay sound dangerous so verification felt costly.",
    counterAction: "Pause. A legitimate process can survive an independent check.",
  },
  authority: {
    label: "Authority",
    explanation: "The caller borrowed status from an institution they did not control.",
    counterAction: "Verify the affiliation through the institution's own directory.",
  },
  scarcity: {
    label: "Scarcity",
    explanation: "The caller implied the opportunity would disappear if you checked it.",
    counterAction: "Treat artificial scarcity as a reason to slow down.",
  },
  reciprocity: {
    label: "Reciprocity",
    explanation: "The caller framed the offer as a favor that required immediate cooperation.",
    counterAction: "An offered benefit never creates a duty to share information.",
  },
};

export function isPressureTactic(value: unknown): value is PressureTactic {
  return typeof value === "string" && PRESSURE_TACTICS.includes(value as PressureTactic);
}

export function parsePressureToolPayload(
  value: unknown,
): { success: true; tactic: PressureTactic } | { success: false } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { success: false };
  }
  const entries = Object.entries(value);
  if (entries.length !== 1 || entries[0][0] !== "tactic") {
    return { success: false };
  }
  return isPressureTactic(entries[0][1])
    ? { success: true, tactic: entries[0][1] }
    : { success: false };
}
