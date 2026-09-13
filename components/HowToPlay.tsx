"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2, CircleCheck, Mail, Pin, Search, type LucideIcon } from "lucide-react";
import { PlayingCardShell } from "@/components/ArtifactCard";
import { EASE_DEAL } from "@/lib/motion";

const ROTATIONS = [-6, 0, 6] as const;
const STACK_ROTATIONS = [-1.5, 1, -1] as const;

type Step = {
  mark: string;
  icon: LucideIcon;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    mark: "1",
    icon: Search,
    title: "Investigate",
    body: "Open the cards. Question the caller. Look for a second source.",
  },
  {
    mark: "2",
    icon: Pin,
    title: "Pin what you trust",
    body: "Only pinned evidence is scored. Opening a card is free.",
  },
  {
    mark: "3",
    icon: CircleCheck,
    title: "Call it",
    body: "Place a chip. Not enough evidence is a real answer.",
  },
];

function CornerIndex({ step }: { step: Step }) {
  const Icon = step.icon;
  return (
    <div className="flex w-5 flex-col items-center gap-0.5" aria-hidden>
      <span className="font-serif text-[15px] leading-none font-semibold text-ink">
        {step.mark}
      </span>
      <Icon size={13} strokeWidth={1.75} className="text-gold" aria-hidden />
    </div>
  );
}

function RuleCard({
  step,
  index,
  reduce,
  stacked = false,
}: {
  step: Step;
  index: number;
  reduce: boolean;
  stacked?: boolean;
}) {
  const Icon = step.icon;
  return (
    <motion.li
      className={stacked || index === 0 ? "list-none" : "-ml-6 list-none"}
      initial={reduce ? false : { x: 150, y: -36, rotate: 12, opacity: 0 }}
      animate={{
        x: 0,
        y: stacked ? 0 : index === 1 ? -12 : 0,
        rotate: stacked ? STACK_ROTATIONS[index] : ROTATIONS[index],
        opacity: 1,
      }}
      transition={
        reduce ? { duration: 0 } : { duration: 0.42, delay: 0.12 + index * 0.09, ease: EASE_DEAL }
      }
    >
      <PlayingCardShell width="w-[200px]">
        <div className="pointer-events-none absolute inset-[14px]" aria-hidden>
          <div className="absolute top-0 left-0">
            <CornerIndex step={step} />
          </div>
          <div className="absolute right-0 bottom-0 rotate-180">
            <CornerIndex step={step} />
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-7 text-center">
          <Icon size={28} strokeWidth={1.75} aria-hidden className="text-ink" />
          <p className="font-serif text-[16px] leading-tight font-semibold text-ink">
            {step.title}
          </p>
          <p className="font-sans text-[12px] leading-snug text-ink/70">{step.body}</p>
        </div>
      </PlayingCardShell>
    </motion.li>
  );
}

/** Three-card explainer dealt beside the nameplate on the start screen. */
export function HowToPlayCards() {
  const reduce = Boolean(useReducedMotion());

  return (
    <section aria-labelledby="how-to-play-title" className="w-full">
      <h2
        id="how-to-play-title"
        className="font-label text-[12px] tracking-[0.08em] text-cream/70 uppercase"
      >
        How to play
      </h2>

      <ul className="mt-4 flex flex-col items-center gap-4 min-[560px]:hidden">
        {STEPS.map((step, index) => (
          <RuleCard key={step.mark} step={step} index={index} reduce={reduce} stacked />
        ))}
      </ul>

      {/* Scaling leaves layout slack under the hand, so pull the legend back up. */}
      <div className="hidden justify-center min-[560px]:-mb-14 min-[560px]:flex min-[720px]:-mb-7 lg:-mb-8 lg:justify-start min-[1040px]:mb-0">
        <ul className="mt-4 flex origin-top items-end min-[560px]:scale-[0.78] min-[720px]:scale-90 lg:origin-top-left lg:scale-[0.88] min-[1040px]:scale-100">
          {STEPS.map((step, index) => (
            <RuleCard key={step.mark} step={step} index={index} reduce={reduce} />
          ))}
        </ul>
      </div>

      <p className="mt-5 max-w-[44ch] text-[13px] leading-relaxed text-cream/70 min-[560px]:mt-3 min-[1040px]:mt-7">
        A card they handed you is marked red
        <Mail size={12} strokeWidth={2} aria-hidden className="mx-1 inline align-[-1px] text-red" />
        and a card you found yourself is marked gold
        <Building2
          size={12}
          strokeWidth={2}
          aria-hidden
          className="mx-1 inline align-[-1px] text-gold"
        />
        . Both can be pinned, but only gold earns the independence points.
      </p>
    </section>
  );
}
