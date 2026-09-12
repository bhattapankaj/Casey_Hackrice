"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Link2, X } from "lucide-react";
import { ArtifactCard } from "@/components/ArtifactCard";
import { ChipFace } from "@/components/VerdictChip";
import { SiteNav } from "@/components/SiteNav";
import { BAND_LABEL } from "@/lib/channels";
import type { CaseArtifact, GameCase, Verdict } from "@/lib/cases";
import { nextCaseId } from "@/lib/cases";
import {
  EASE_DEAL,
  EASE_OPEN,
  RECEIPT_DURATION,
  RECEIPT_FLIP,
  RECEIPT_STAGGER,
  REDUCE_DURATION,
} from "@/lib/motion";
import { buildReceipt } from "@/lib/scoring";
import { recordCaseResult } from "@/lib/session";
import { play } from "@/lib/sound";

type ReceiptProps = {
  gameCase: GameCase;
  verdict: Verdict;
  opened: CaseArtifact[];
  baseScore: number;
  onReplay: () => void;
};

export function Receipt({
  gameCase,
  verdict,
  opened,
  baseScore,
  onReplay,
}: ReceiptProps) {
  const reduce = useReducedMotion();
  const model = buildReceipt(gameCase, verdict, opened, baseScore);
  const nextId = nextCaseId(gameCase.id);

  // Replaying a case overwrites its contribution, so points never stack up.
  useEffect(() => {
    recordCaseResult(gameCase.id, model.delta, {
      verdict,
      truth: gameCase.truth,
      correct: model.correct,
      delta: model.delta,
      evidenceCount: opened.length,
      independentCount: model.independentCount,
    });
  }, [
    gameCase.id,
    gameCase.truth,
    verdict,
    model.delta,
    model.correct,
    model.independentCount,
    opened.length,
  ]);

  const chainLength = opened.length;
  useEffect(() => {
    const step = reduce ? 40 : RECEIPT_STAGGER * 1000;
    const snap = reduce ? 0 : (RECEIPT_FLIP * 1000) / 2;
    const timers = Array.from({ length: chainLength }, (_, index) =>
      window.setTimeout(() => play("reveal"), snap + index * step),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [chainLength, reduce]);

  let flipIndex = 0;

  return (
    <>
      <SiteNav />
      <main className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col px-4 py-6 sm:px-5">
        <p className="font-label text-[12px] tracking-[0.08em] text-cream/70">
          Showdown
        </p>
        <h1 className="mt-1 font-serif text-[30px] leading-tight font-semibold text-cream sm:text-[37px]">
          {gameCase.title}
        </h1>

        {/* The three facts that matter, before anything else. */}
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="surface-cream rounded-[12px] bg-cream p-4 text-ink">
            <dt className="font-label text-[12px] tracking-[0.08em] text-ink/60">
              Your verdict
            </dt>
            <dd className="mt-2 flex items-center gap-3">
              <ChipFace verdict={verdict} size={36} />
              <span className="font-serif text-[19px] font-semibold">
                {model.verdictLabel}
              </span>
            </dd>
          </div>
          <div className="surface-cream rounded-[12px] bg-cream p-4 text-ink">
            <dt className="font-label text-[12px] tracking-[0.08em] text-ink/60">
              Actual outcome
            </dt>
            <dd className="mt-2 flex items-center gap-2 font-serif text-[19px] font-semibold">
              {model.correct ? (
                <Check size={20} strokeWidth={2.25} aria-hidden className="text-felt-deep" />
              ) : (
                <X size={20} strokeWidth={2.25} aria-hidden className="text-red" />
              )}
              {model.truthLabel}
              <span className="sr-only">
                {model.correct ? "Your verdict matched." : "Your verdict did not match."}
              </span>
            </dd>
          </div>
          <div className="surface-cream rounded-[12px] bg-cream p-4 text-ink">
            <dt className="font-label text-[12px] tracking-[0.08em] text-ink/60">
              This case score
            </dt>
            <dd className="mt-2 font-serif text-[30px] leading-none font-semibold">
              {model.delta > 0 ? `+${model.delta}` : model.delta}
            </dd>
          </div>
        </dl>

        {/* Evidence regrouped by where it actually came from. */}
        <h2 className="mt-10 font-serif text-[24px] font-semibold text-cream">
          Where your evidence came from
        </h2>
        <p className="mt-2 max-w-[62ch] text-[16px] leading-relaxed text-cream/85">
          {model.summary}
        </p>

        {opened.length === 0 ? (
          <p className="mt-5 max-w-[62ch] rounded-[12px] border border-cream/20 p-4 text-[16px] leading-relaxed text-cream/85">
            You submitted without opening any cards, so there is no source trail
            to show. Opening even one card gives you something to reason from.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            {model.groups.map((group, groupIndex) => (
              <div key={group.id} className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {groupIndex > 0 ? (
                  <div
                    className="flex items-center gap-2 lg:mt-16 lg:flex-col"
                    aria-hidden
                  >
                    <span className="h-px w-8 bg-cream/25 lg:h-8 lg:w-px" />
                    <span className="font-label text-[10px] tracking-[0.08em] whitespace-nowrap text-cream/55">
                      separate origin
                    </span>
                    <span className="h-px w-8 bg-cream/25 lg:h-8 lg:w-px" />
                  </div>
                ) : null}

                <div className="rounded-[12px] border border-cream/20 p-4">
                  <p className="font-label text-[11px] tracking-[0.08em] text-cream/60">
                    {BAND_LABEL[group.band]}
                  </p>
                  <p className="mt-1 text-[16px] font-semibold text-cream">
                    {group.label}
                  </p>

                  <div className="mt-3 flex flex-wrap items-start gap-3">
                    {group.artifacts.map((artifact, index) => {
                      const delay = flipIndex * RECEIPT_STAGGER;
                      flipIndex += 1;
                      return (
                        <div key={artifact.id} className="flex items-start gap-3">
                          {index > 0 ? (
                            <span
                              className="mt-16 flex shrink-0 items-center gap-1 font-label text-[10px] tracking-[0.08em] text-cream/55"
                              aria-hidden
                            >
                              <Link2 size={12} strokeWidth={2} />
                              same
                            </span>
                          ) : null}
                          <motion.div
                            className="relative h-[139px] w-[105px]"
                            style={{ perspective: 900 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                              duration: reduce ? REDUCE_DURATION : RECEIPT_DURATION,
                              delay: reduce ? 0 : delay,
                              ease: EASE_DEAL,
                            }}
                          >
                            <motion.div
                              className="relative h-full w-full"
                              style={{ transformStyle: "preserve-3d" }}
                              initial={{ rotateY: 180 }}
                              animate={{ rotateY: 0 }}
                              transition={{
                                duration: reduce ? 0 : RECEIPT_FLIP,
                                delay: reduce ? 0 : delay,
                                ease: EASE_OPEN,
                              }}
                            >
                              <div
                                className="absolute inset-0"
                                style={{ backfaceVisibility: "hidden" }}
                              >
                                <div className="origin-top-left scale-[0.553]">
                                  <ArtifactCard
                                    channel={artifact.channel}
                                    band={artifact.band}
                                    label={artifact.label}
                                    state="viewed"
                                    interactive={false}
                                  />
                                </div>
                              </div>
                              <div
                                className="absolute inset-0"
                                aria-hidden
                                style={{
                                  backfaceVisibility: "hidden",
                                  transform: "rotateY(180deg)",
                                }}
                              >
                                <div className="origin-top-left scale-[0.553]">
                                  <ArtifactCard
                                    channel={artifact.channel}
                                    band={artifact.band}
                                    label={artifact.label}
                                    state="facedown"
                                    interactive={false}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-10 font-serif text-[24px] font-semibold text-cream">
          What the independent check established
        </h2>
        <p className="mt-2 max-w-[62ch] text-[16px] leading-relaxed text-cream/90">
          {model.independentCount === 0
            ? "You did not open an independent source this time, so nothing here was confirmed outside their own channel."
            : model.independentFinding}
        </p>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-cream/75">
          {model.independentLimit}
        </p>

        <h2 className="mt-10 font-serif text-[24px] font-semibold text-cream">
          Score breakdown
        </h2>
        <ul className="mt-3 max-w-[46rem]">
          {model.lines.map((line) => (
            <li
              key={line.text}
              className="flex items-start justify-between gap-4 border-b border-cream/15 py-3"
            >
              <span className="flex items-start gap-3 text-[16px] text-cream">
                {line.ok ? (
                  <Check size={20} strokeWidth={2} aria-hidden className="mt-0.5 shrink-0 text-cream" />
                ) : (
                  <X size={20} strokeWidth={2} aria-hidden className="mt-0.5 shrink-0 text-red" />
                )}
                {line.text}
              </span>
              {line.delta !== 0 ? (
                <span className="shrink-0 font-serif text-[19px] font-semibold text-cream">
                  {line.delta > 0 ? `+${line.delta}` : line.delta}
                </span>
              ) : null}
            </li>
          ))}
          <li className="flex items-baseline justify-between gap-4 border-b border-cream/15 py-3">
            <span className="text-[16px] text-cream">This case</span>
            <span className="font-serif text-[24px] font-semibold text-cream">
              {model.delta > 0 ? `+${model.delta}` : model.delta}
            </span>
          </li>
          <li className="flex items-baseline justify-between gap-4 py-3">
            <span className="text-[16px] font-semibold text-cream">Run total</span>
            <span className="font-serif text-[37px] leading-none font-semibold text-cream">
              {model.total}
            </span>
          </li>
        </ul>

        <h2 className="mt-10 font-serif text-[24px] font-semibold text-cream">
          Take this with you
        </h2>
        <p className="mt-2 max-w-[62ch] text-[16px] leading-relaxed text-cream/90">
          {model.lesson}
        </p>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-cream/90">
          <span className="font-semibold">Practise this: </span>
          {model.habit}
        </p>

        <a
          href={model.realWorldLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-[44px] max-w-[46rem] items-center gap-2 text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
        >
          {model.realWorldLabel}
          <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
        </a>

        <div className="mt-10 flex flex-wrap items-center gap-5">
          {nextId ? (
            <Link
              href={`/play/${nextId}`}
              className="surface-cream inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-cream px-6 font-sans text-[16px] font-semibold text-ink"
            >
              Next case
              <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
            </Link>
          ) : (
            <Link
              href="/board"
              className="surface-cream inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-cream px-6 font-sans text-[16px] font-semibold text-ink"
            >
              Finish the run
              <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
            </Link>
          )}
          <button
            type="button"
            onClick={onReplay}
            className="min-h-[44px] font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
          >
            Retry this case
          </button>
          <Link
            href="/board"
            className="min-h-[44px] font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
          >
            See the board
          </Link>
        </div>
      </main>
    </>
  );
}
