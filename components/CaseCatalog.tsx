"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CatalogCard } from "@/components/CatalogCard";
import { ProgressReset } from "@/components/ProgressReset";
import { SiteNav } from "@/components/SiteNav";
import { useCatalogStats } from "@/hooks/useCatalogStats";
import { getEnabledCases } from "@/lib/cases/registry";
import { UPCOMING_CASES } from "@/lib/cases/upcoming";
import { DEAL_DURATION, DEAL_STAGGER, EASE_DEAL } from "@/lib/motion";
import { seededRotation } from "@/lib/seededRotation";

const PLAYABLE = getEnabledCases();

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 text-center sm:min-w-[7rem]">
      <p className="font-label text-[11px] tracking-[0.08em] text-cream/65 uppercase">{label}</p>
      <p className="mt-1 font-serif text-[24px] leading-none font-semibold text-cream">{value}</p>
    </div>
  );
}

export function CaseCatalog() {
  const reduce = useReducedMotion();
  const catalog = useCatalogStats();

  return (
    <>
      <SiteNav chips={catalog.progress.chips} />
      <main className="relative mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-4 sm:px-5">
        <h1 className="mt-1 font-serif text-[30px] leading-tight font-semibold text-cream">
          Take the call. Verify everything.
        </h1>
        <p className="mt-1 max-w-[46ch] text-[15px] leading-relaxed text-cream/85">
          A voice-first investigation game. Pin evidence from a source they did not hand you.
        </p>

        <div className="mt-3 flex items-end justify-between gap-3 border-y border-cream/15 py-2 sm:justify-start sm:gap-10">
          <Stat label="Cases completed" value={catalog.stats.casesCompleted} />
          <Stat label="Best streak" value={catalog.stats.bestStreak} />
          <Stat label="Total score" value={catalog.stats.totalScore} />
        </div>

        <section aria-labelledby="playable-heading" className="mt-4">
          <h2
            id="playable-heading"
            className="font-label text-[11px] tracking-[0.08em] text-cream/65 uppercase"
          >
            On the table
          </h2>
          <div className="-mx-4 mt-3 flex gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 lg:justify-start">
            {PLAYABLE.map((gameCase, index) => (
              <motion.div
                key={gameCase.id}
                className="shrink-0"
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
                />
              </motion.div>
            ))}
          </div>
        </section>

        <section aria-labelledby="upcoming-heading" className="mt-2">
          <h2
            id="upcoming-heading"
            className="font-label text-[11px] tracking-[0.08em] text-cream/65 uppercase"
          >
            Next up
          </h2>
          <div className="-mx-4 mt-3 flex gap-5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 lg:justify-start">
            {UPCOMING_CASES.map((entry, index) => (
              <motion.div
                key={entry.id}
                className="shrink-0"
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
                />
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="mt-1 lg:absolute lg:bottom-2 lg:left-5">
          <ProgressReset onReset={catalog.reset} />
        </footer>
      </main>
    </>
  );
}
