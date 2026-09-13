"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, CircleHelp, X } from "lucide-react";
import type { Verdict } from "@/lib/cases/schema";
import { CHIP_DURATION, EASE_DEAL } from "@/lib/motion";

export const VERDICT_ORDER: Verdict[] = ["scam", "legit", "not_enough_evidence"];

type ChipCopy = {
  label: string;
  action: string;
  icon: typeof X;
  accent: string;
};

export const CHIP_COPY: Record<Verdict, ChipCopy> = {
  scam: {
    label: "Scam",
    action: "Call it a scam",
    icon: X,
    accent: "var(--color-red)",
  },
  legit: {
    label: "Legitimate",
    action: "Call it legitimate",
    icon: Check,
    accent: "var(--color-felt-deep)",
  },
  not_enough_evidence: {
    label: "Not enough evidence",
    action: "Choose not enough evidence",
    icon: CircleHelp,
    accent: "var(--color-ink)",
  },
};

export function ChipFace({ verdict, size = 68 }: { verdict: Verdict; size?: number }) {
  const { icon: Icon, accent } = CHIP_COPY[verdict];
  const rim = Math.round(size * 0.13);
  const spotted = size >= 48;

  return (
    <span
      className="relative inline-block shrink-0 rounded-full bg-cream"
      style={{
        width: size,
        height: size,
        boxShadow: "0 2px 6px rgba(37,33,33,0.28), inset 0 -1px 0 rgba(37,33,33,0.14)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: spotted
            ? `repeating-conic-gradient(${accent} 0deg 17deg, transparent 17deg 45deg)`
            : accent,
        }}
      />
      <span
        aria-hidden
        className="absolute rounded-full bg-cream"
        style={{
          inset: rim,
          boxShadow: "inset 0 0 0 1px rgba(37,33,33,0.14)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: accent }}
      >
        <Icon size={Math.round(size * 0.34)} strokeWidth={2.25} />
      </span>
    </span>
  );
}

type VerdictChipProps = {
  verdict: Verdict;
  selected: Verdict | null;
  committed: boolean;
  onSelect: (verdict: Verdict) => void;
  inSpot?: boolean;
};

export function VerdictChip({
  verdict,
  selected,
  committed,
  onSelect,
  inSpot = false,
}: VerdictChipProps) {
  const reduce = useReducedMotion();
  const copy = CHIP_COPY[verdict];
  const isSelected = selected === verdict;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(verdict)}
      disabled={committed}
      aria-pressed={isSelected}
      aria-label={copy.action}
      tabIndex={0}
      layoutId={`chip-${verdict}`}
      className="flex min-h-[44px] cursor-pointer flex-col items-center gap-2 disabled:cursor-default"
      transition={{ duration: reduce ? 0 : CHIP_DURATION, ease: EASE_DEAL }}
      whileHover={committed || reduce ? undefined : { y: -4 }}
      whileTap={committed || reduce ? undefined : { y: 1 }}
    >
      <ChipFace verdict={verdict} size={68} />
      {inSpot ? null : (
        <span className="max-w-[7.5rem] text-center font-label text-[12px] leading-snug tracking-[0.08em] text-cream">
          {copy.label}
        </span>
      )}
    </motion.button>
  );
}
