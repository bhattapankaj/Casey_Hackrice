"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Search, X } from "lucide-react";
import { CHIP_DURATION, CHIP_FADE, EASE_DEAL, REDUCE_DURATION } from "@/lib/motion";
import type { Verdict } from "@/lib/cases";

type VerdictChipProps = {
  verdict: Verdict;
  selected: Verdict | null;
  onSelect: (verdict: Verdict) => void;
};

const COPY: Record<
  Verdict,
  { label: string; action: string; icon: typeof X }
> = {
  scam: { label: "It is a scam", action: "Call it a scam", icon: X },
  legit: { label: "Legitimate", action: "Call it legitimate", icon: Check },
  more: {
    label: "Need more evidence",
    action: "Ask for more evidence",
    icon: Search,
  },
};

export function VerdictChip({ verdict, selected, onSelect }: VerdictChipProps) {
  const reduce = useReducedMotion();
  const copy = COPY[verdict];
  const Icon = copy.icon;
  const isSelected = selected === verdict;
  const isDimmed = selected !== null && !isSelected;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(verdict)}
      disabled={selected !== null}
      aria-pressed={isSelected}
      aria-label={copy.action}
      className="flex flex-col items-center gap-2 disabled:cursor-default"
      initial={false}
      animate={
        reduce
          ? { opacity: isDimmed ? 0.4 : 1 }
          : {
              y: isSelected ? -120 : 0,
              scale: isSelected ? 0.9 : 1,
              opacity: isDimmed ? 0.4 : 1,
            }
      }
      whileHover={
        selected === null && !reduce ? { y: -4 } : undefined
      }
      whileTap={
        selected === null && !reduce ? { y: 1 } : undefined
      }
      transition={
        reduce
          ? { duration: REDUCE_DURATION, ease: "easeOut" }
          : isSelected
            ? { duration: CHIP_DURATION, ease: EASE_DEAL }
            : { duration: CHIP_FADE, ease: "easeOut" }
      }
    >
      <span className="flex size-[82px] items-center justify-center">
        <span className="flex size-[68px] items-center justify-center rounded-full bg-cream text-ink shadow-[0_2px_8px_rgba(37,33,33,0.18)] [outline:3px_solid_var(--color-cream)] [outline-offset:4px]">
          <Icon size={22} strokeWidth={1.75} aria-hidden />
        </span>
      </span>
      <span className="max-w-[6.5rem] text-center font-label text-[12px] leading-snug tracking-[0.08em] text-cream min-[520px]:max-w-[7.5rem]">
        {copy.label}
      </span>
    </motion.button>
  );
}
