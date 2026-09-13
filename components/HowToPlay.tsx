"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CircleCheck, Club, Diamond, Pin, Search, Spade, type LucideIcon } from "lucide-react";
import { MirroredCorner, PlayingCardShell } from "@/components/ArtifactCard";
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
      <PlayingCardShell
        width={
          stacked
            ? "w-[186px] sm:w-[200px]"
            : "w-[164px] min-[720px]:w-[180px] min-[1100px]:w-[186px]"
        }
      >
        <div className="pointer-events-none absolute inset-[14px]" aria-hidden>
          <div className="absolute top-0 left-0">
            <CornerIndex step={step} />
          </div>
          <MirroredCorner>
            <CornerIndex step={step} />
          </MirroredCorner>
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

function SuitPip({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon;
  label: string;
  className: string;
}) {
  return (
    <Icon
      size={16}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.2}
      aria-label={label}
      className={className}
    />
  );
}

function SuitKey({
  icon,
  suit,
  meaning,
  pipClass,
  labelClass,
}: {
  icon: LucideIcon;
  suit: string;
  meaning: string;
  pipClass: string;
  labelClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <SuitPip icon={icon} label={suit} className={pipClass} />
      <div>
        <p className={`font-label text-[11px] tracking-[0.12em] uppercase ${labelClass}`}>{suit}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-cream/75">{meaning}</p>
      </div>
    </div>
  );
}

function ClubLine({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <Club
        size={13}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.2}
        aria-hidden
        className="mt-0.5 shrink-0 text-cream"
      />
      <p className="text-[13px] leading-relaxed text-cream/80">{children}</p>
    </li>
  );
}

function SourceLegend() {
  return (
    <div className="mx-auto w-full max-w-[26rem] lg:mx-0">
      <div className="flex items-start justify-between gap-6">
        <SuitKey
          icon={Diamond}
          suit="Diamond"
          meaning="They handed you"
          pipClass="text-red"
          labelClass="text-red"
        />
        <SuitKey
          icon={Spade}
          suit="Spade"
          meaning="You found it"
          pipClass="text-gold"
          labelClass="text-gold"
        />
      </div>
      <ul className="mt-4 flex list-none flex-col gap-2 p-0">
        {STEPS.map((step) => (
          <ClubLine key={step.mark}>
            <span className="font-semibold text-cream">{step.title}.</span> {step.body}
          </ClubLine>
        ))}
        <ClubLine>Both pin. Only the spade scores independence.</ClubLine>
      </ul>
    </div>
  );
}

/** Three-card explainer dealt beside the nameplate on the start screen. */
export function HowToPlayCards() {
  const reduce = Boolean(useReducedMotion());

  return (
    <section aria-labelledby="how-to-play-title" className="w-full">
      <h2
        id="how-to-play-title"
        className="text-center font-label text-[12px] tracking-[0.08em] text-cream/70 uppercase lg:text-left"
      >
        How to play
      </h2>

      <ul className="mt-4 flex flex-col items-center gap-3 min-[560px]:hidden">
        {STEPS.map((step, index) => (
          <RuleCard key={step.mark} step={step} index={index} reduce={reduce} stacked />
        ))}
      </ul>

      <div className="hidden min-[560px]:block">
        <ul className="mt-4 flex items-end justify-center lg:justify-start">
          {STEPS.map((step, index) => (
            <RuleCard key={step.mark} step={step} index={index} reduce={reduce} />
          ))}
        </ul>
      </div>

      <div className="mt-5 min-[560px]:mt-6">
        <SourceLegend />
      </div>
    </section>
  );
}
