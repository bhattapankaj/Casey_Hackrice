"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CasinoChip, CASINO_SUIT_ORDER, SuitMarks } from "@/components/CasinoDetails";
import { CatalogCard } from "@/components/CatalogCard";
import { ProgressReset } from "@/components/ProgressReset";
import { SiteNav } from "@/components/SiteNav";
import { useCatalogStats } from "@/hooks/useCatalogStats";
import { getEnabledCases } from "@/lib/cases/registry";
import { UPCOMING_CASES } from "@/lib/cases/upcoming";
import { DEAL_DURATION, DEAL_STAGGER, EASE_DEAL } from "@/lib/motion";
import { seededRotation } from "@/lib/seededRotation";

const PLAYABLE = getEnabledCases();

function Stat({
  label,
  value,
  measure,
}: {
  label: string;
  value: number;
  measure: string;
}) {
  const chipLabel = value >= 1000 ? `${Math.floor(value / 1000)}K` : value;

  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <CasinoChip label={chipLabel} size={52} decorative />
      <div>
        <p className="font-label text-[8px] tracking-[0.13em] text-cream/50 uppercase sm:text-[9px]">
          {label}
        </p>
        <p className="mt-0.5 font-serif text-[15px] leading-tight font-semibold text-cream">
          {value.toLocaleString()} {measure}
        </p>
      </div>
    </div>
  );
}

export function CaseCatalog() {
  const reduce = useReducedMotion();
  const catalog = useCatalogStats();

  return (
    <>
      <SiteNav chips={catalog.progress.chips} />
      <main className="mx-auto min-h-screen w-full max-w-[1240px] px-4 pb-8 sm:px-5">
        <header className="mx-auto mt-3 max-w-[760px] text-center sm:mt-6">
          <div className="flex items-center justify-center gap-3">
            <SuitMarks />
            <p className="font-label text-[10px] tracking-[0.18em] text-gold uppercase">
              Baker Street Case Room
            </p>
            <SuitMarks />
          </div>
          <h1 className="mt-2 font-serif text-[32px] leading-tight font-semibold text-cream sm:text-[44px]">
            Choose a case. Read every tell.
          </h1>
          <p className="mx-auto mt-2 max-w-[54ch] text-[14px] leading-relaxed text-cream/75 sm:text-[15px]">
            The caller controls the story. Your independent source controls the verdict.
          </p>
        </header>

        <div className="mx-auto mt-5 flex max-w-[760px] flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-[18px] border border-gold/35 bg-ink/55 px-4 py-3 shadow-[0_10px_24px_rgba(17,28,22,0.3)] sm:gap-x-10">
          <Stat label="Cases completed" value={catalog.stats.casesCompleted} measure="cases" />
          <Stat label="Best streak" value={catalog.stats.bestStreak} measure="in a row" />
          <Stat label="Total score" value={catalog.stats.totalScore} measure="points" />
        </div>

        <section
          aria-labelledby="playable-heading"
          className="relative mt-7 rounded-[34px] border-[9px] border-ink bg-felt-deep p-1.5 shadow-[0_22px_48px_rgba(17,28,22,0.5),inset_0_0_0_1px_rgba(245,239,224,0.18)] sm:rounded-[52px] sm:border-[12px] sm:p-2"
        >
          <div className="relative overflow-hidden rounded-[22px] border border-gold/70 bg-felt px-3 py-6 sm:rounded-[38px] sm:px-7 sm:py-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(ellipse_at_center,transparent_0%,transparent_48%,rgba(24,48,36,0.85)_100%)]"
            />
            <div className="relative flex items-end justify-between gap-4 px-1 sm:px-3">
              <div>
                <p className="font-label text-[9px] tracking-[0.17em] text-gold uppercase">
                  Dealer&apos;s choice
                </p>
                <h2
                  id="playable-heading"
                  className="mt-0.5 font-serif text-[22px] font-semibold text-cream sm:text-[25px]"
                >
                  Case files on the table
                </h2>
              </div>
              <p className="hidden max-w-[31ch] text-right text-[11px] leading-relaxed text-cream/55 sm:block">
                Suit marks set the table mood. Evidence decides the truth.
              </p>
            </div>

            <div className="relative -mx-3 mt-7 flex snap-x snap-mandatory gap-6 overflow-x-auto px-7 pt-1 pb-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-2">
              {PLAYABLE.map((gameCase, index) => (
                <motion.div
                  key={gameCase.id}
                  className="shrink-0 snap-center"
                  initial={reduce ? false : { x: 80, y: -20, opacity: 0 }}
                  animate={{
                    x: 0,
                    y: 0,
                    rotate: seededRotation(gameCase.id),
                    opacity: 1,
                  }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration: DEAL_DURATION, delay: index * DEAL_STAGGER, ease: EASE_DEAL }
                  }
                >
                  <CatalogCard
                    rank={gameCase.rank}
                    category={gameCase.category}
                    title={gameCase.neutralTitle}
                    estimatedMinutes={gameCase.estimatedMinutes}
                    status={catalog.statusFor(gameCase.id)}
                    bestHand={catalog.progress.cases[gameCase.id]?.bestHand ?? null}
                    href={`/play/${gameCase.id}`}
                    suit={CASINO_SUIT_ORDER[index % CASINO_SUIT_ORDER.length]}
                  />
                </motion.div>
              ))}
            </div>

            <div className="relative mx-auto mt-5 flex w-fit items-center gap-3 rounded-full border border-cream/20 bg-ink/75 px-5 py-2 shadow-[0_7px_18px_rgba(17,28,22,0.35)]">
              <span className="size-2 rounded-full bg-gold" aria-hidden />
              <p className="font-label text-[9px] tracking-[0.14em] text-cream/70 uppercase">
                Open a file to take your seat
              </p>
              <span className="size-2 rounded-full bg-gold" aria-hidden />
            </div>
          </div>
        </section>

        <section aria-labelledby="upcoming-heading" className="mt-8">
          <div className="flex items-center justify-between gap-4 border-b border-cream/15 pb-3">
            <div>
              <p className="font-label text-[9px] tracking-[0.17em] text-cream/45 uppercase">
                Behind the dealer
              </p>
              <h2
                id="upcoming-heading"
                className="mt-0.5 font-serif text-[21px] font-semibold text-cream"
              >
                Next hands
              </h2>
            </div>
            <SuitMarks />
          </div>
          <div className="-mx-4 mt-5 flex snap-x gap-5 overflow-x-auto px-6 pt-1 pb-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 lg:justify-start">
            {UPCOMING_CASES.map((entry, index) => (
              <motion.div
                key={entry.id}
                className="shrink-0 snap-center"
                initial={reduce ? false : { x: 80, y: -16, opacity: 0 }}
                animate={{
                  x: 0,
                  y: 0,
                  rotate: seededRotation(entry.id),
                  opacity: 1,
                }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        duration: DEAL_DURATION,
                        delay: 0.18 + index * DEAL_STAGGER,
                        ease: EASE_DEAL,
                      }
                }
              >
                <CatalogCard
                  rank={entry.rank}
                  category={entry.category}
                  title={entry.neutralTitle}
                  estimatedMinutes={entry.estimatedMinutes}
                  upcoming
                  width="w-[184px]"
                  suit={CASINO_SUIT_ORDER[(index + PLAYABLE.length) % CASINO_SUIT_ORDER.length]}
                />
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="mt-3 border-t border-cream/10 pt-3">
          <ProgressReset onReset={catalog.reset} />
        </footer>
      </main>
    </>
  );
}
