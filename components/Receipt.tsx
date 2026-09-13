"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ExternalLink, Link2, X } from "lucide-react";
import { ArtifactCard } from "@/components/ArtifactCard";
import { NicknamePrompt } from "@/components/NicknamePrompt";
import { ChipFace } from "@/components/VerdictChip";
import { SiteNav } from "@/components/SiteNav";
import { sourceClassToBand } from "@/lib/cases/public-case";
import type { Verdict } from "@/lib/cases/schema";
import type { ScoreExplanationKey, ScoreReceipt } from "@/lib/engine/types";
import {
  EASE_DEAL,
  EASE_OPEN,
  RECEIPT_DURATION,
  RECEIPT_FLIP,
  RECEIPT_STAGGER,
  REDUCE_DURATION,
} from "@/lib/motion";
import { play } from "@/lib/sound";

type ReceiptProps = {
  receipt: ScoreReceipt;
  playerName: string;
  tableScore?: number;
  onReplay: () => void;
};

const VERDICT_LABELS: Record<Verdict, string> = {
  scam: "Scam",
  legit: "Legitimate",
  not_enough_evidence: "Not enough evidence",
};

const EXPLANATIONS: Record<ScoreExplanationKey, string> = {
  "verdict.correct": "Verdict matches the authored truth.",
  "verdict.incorrect": "Verdict does not match the authored truth.",
  "verdict.missing": "No verdict was committed.",
  "independence.decisive": "Pinned decisive proof came from an independent source.",
  "independence.corroborative": "Pinned independent evidence was corroborative, not decisive.",
  "independence.claimant_only": "Pinned support stayed within the claimant's source.",
  "independence.unresolved_check": "An independent check confirmed that the case remains unresolved.",
  "independence.none": "No pinned independent support was present.",
  "evidence.supporting": "Pinned evidence supports the selected verdict.",
  "evidence.mixed": "The Trust Chain contains evidence that contradicts the verdict.",
  "evidence.none": "No evidence was pinned.",
  "composure.full": "No unsafe authored action was taken.",
  "composure.reduced": "An unsafe authored action reduced composure.",
};

const SCORE_LINES = [
  ["Verdict", "verdict"],
  ["Independence", "independence"],
  ["Evidence quality", "evidenceQuality"],
  ["Composure", "composure"],
] as const;

export function Receipt({ receipt, playerName, tableScore, onReplay }: ReceiptProps) {
  const reduce = useReducedMotion();
  const correct = receipt.truth === receipt.selectedVerdict;

  useEffect(() => {
    const step = reduce ? 40 : RECEIPT_STAGGER * 1000;
    const snap = reduce ? 0 : (RECEIPT_FLIP * 1000) / 2;
    const cardCount = receipt.pinnedArtifacts.length + receipt.pressureCards.length;
    const timers = Array.from({ length: cardCount }, (_, index) =>
      window.setTimeout(() => play("reveal"), snap + index * step),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [receipt.pinnedArtifacts.length, receipt.pressureCards.length, reduce]);

  let flipIndex = 0;

  return (
    <>
      <SiteNav />
      <main className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col px-4 py-6 sm:px-5">
        <p className="font-label text-[12px] tracking-[0.08em] text-cream/70">RECEIPT</p>
        <h1 className="mt-1 font-serif text-[30px] leading-tight font-semibold text-cream sm:text-[37px]">
          {receipt.caseTitle}
        </h1>
        <p className="mt-2 text-[16px] text-cream/80">
          {playerName}, here is what your Trust Chain proved.
        </p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="surface-cream rounded-[12px] bg-cream p-4 text-ink">
            <dt className="font-label text-[12px] tracking-[0.08em] text-ink/60">Your verdict</dt>
            <dd className="mt-2 flex items-center gap-3">
              <ChipFace verdict={receipt.selectedVerdict} size={36} />
              <span className="font-serif text-[19px] font-semibold">
                {VERDICT_LABELS[receipt.selectedVerdict]}
              </span>
            </dd>
          </div>
          <div className="surface-cream rounded-[12px] bg-cream p-4 text-ink">
            <dt className="font-label text-[12px] tracking-[0.08em] text-ink/60">Actual outcome</dt>
            <dd className="mt-2 flex items-center gap-2 font-serif text-[19px] font-semibold">
              {correct ? (
                <Check size={20} strokeWidth={2.25} aria-hidden className="text-felt-deep" />
              ) : (
                <X size={20} strokeWidth={2.25} aria-hidden className="text-red" />
              )}
              {VERDICT_LABELS[receipt.truth]}
              <span className="sr-only">
                {correct ? "Your verdict matched." : "Your verdict did not match."}
              </span>
            </dd>
          </div>
          <div className="surface-cream rounded-[12px] bg-cream p-4 text-ink">
            <dt className="font-label text-[12px] tracking-[0.08em] text-ink/60">This case score</dt>
            <dd className="mt-2 font-serif text-[30px] leading-none font-semibold">
              {receipt.score.total} / 1,000
            </dd>
            {tableScore !== undefined ? (
              <p className="mt-2 font-sans text-[13px] text-ink/60">Table points {tableScore}</p>
            ) : null}
          </div>
        </dl>

        <NicknamePrompt />

        <h2 className="mt-10 font-serif text-[24px] font-semibold text-cream">
          Where your pinned evidence came from
        </h2>
        <p className="mt-2 max-w-[62ch] text-[16px] leading-relaxed text-cream/85">
          {receipt.summary}
        </p>

        {receipt.pinnedArtifacts.length === 0 ? (
          <p className="mt-5 max-w-[62ch] rounded-[12px] border border-cream/20 p-4 text-[16px] leading-relaxed text-cream/85">
            You opened cards but pinned no evidence, so there is no Trust Chain to show.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            {receipt.sourceBranches.map((branch, groupIndex) => {
              const artifacts = branch.artifactIds.flatMap((id) => {
                const artifact = receipt.pinnedArtifacts.find((candidate) => candidate.id === id);
                return artifact ? [artifact] : [];
              });
              const band = sourceClassToBand(branch.sourceClass);
              return (
                <div key={branch.sourceRoot} className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  {groupIndex > 0 ? (
                    <div className="flex items-center gap-2 lg:mt-16 lg:flex-col" aria-hidden>
                      <span className="h-px w-8 bg-cream/25 lg:h-8 lg:w-px" />
                      <span className="font-label text-[10px] tracking-[0.08em] whitespace-nowrap text-cream/55">separate origin</span>
                      <span className="h-px w-8 bg-cream/25 lg:h-8 lg:w-px" />
                    </div>
                  ) : null}

                  <div className="rounded-[12px] border border-cream/20 p-4">
                    <p className="font-label text-[11px] tracking-[0.08em] text-cream/60">
                      {branch.sourceClass === "independent" ? "INDEPENDENT SOURCE" : "CLAIMANT SOURCE"}
                    </p>
                    <p className="mt-1 text-[16px] font-semibold text-cream">{branch.sourceRootLabel}</p>
                    <p className="mt-1 text-[13px] text-cream/65">
                      {artifacts.length} pinned {artifacts.length === 1 ? "artifact" : "artifacts"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-start gap-3">
                      {artifacts.map((artifact, index) => {
                        const delay = flipIndex * RECEIPT_STAGGER;
                        flipIndex += 1;
                        return (
                          <div key={artifact.id} className="flex items-start gap-3">
                            {index > 0 ? (
                              <span className="mt-16 flex shrink-0 items-center gap-1 font-label text-[10px] tracking-[0.08em] text-cream/55" aria-hidden>
                                <Link2 size={12} strokeWidth={2} /> same
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
                                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                                  <div className="origin-top-left scale-[0.553]">
                                    <ArtifactCard
                                      channel={artifact.channel}
                                      band={band}
                                      label={artifact.title}
                                      state="viewed"
                                      interactive={false}
                                    />
                                  </div>
                                </div>
                                <div
                                  className="absolute inset-0"
                                  aria-hidden
                                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                                >
                                  <div className="origin-top-left scale-[0.553]">
                                    <ArtifactCard
                                      channel={artifact.channel}
                                      band={band}
                                      label={artifact.title}
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
              );
            })}
          </div>
        )}

        {receipt.pressureCards.length > 0 ? (
          <section className="mt-10" aria-labelledby="pressure-title">
            <h2 id="pressure-title" className="font-serif text-[24px] font-semibold text-cream">Pressure tactics revealed</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {receipt.pressureCards.map((card) => (
                <motion.article
                  key={card.tactic}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ duration: reduce ? REDUCE_DURATION : RECEIPT_FLIP, ease: EASE_OPEN }}
                  className="surface-cream rounded-[12px] bg-cream p-4 text-ink"
                >
                  <h3 className="font-serif text-[19px] font-semibold">{card.label}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed">{card.explanation}</p>
                  <p className="mt-3 text-[14px] font-semibold leading-relaxed">{card.counterAction}</p>
                </motion.article>
              ))}
            </div>
          </section>
        ) : null}

        <h2 className="mt-10 font-serif text-[24px] font-semibold text-cream">Score breakdown</h2>
        <dl className="mt-3 max-w-[46rem]">
          {SCORE_LINES.map(([label, key]) => {
            const dimension = receipt.score[key];
            return (
              <div key={key} className="grid grid-cols-[1fr_auto] gap-4 border-b border-cream/15 py-3">
                <div>
                  <dt className="text-[16px] text-cream">{label}</dt>
                  <dd className="mt-1 text-[13px] text-cream/65">{EXPLANATIONS[dimension.explanationKey]}</dd>
                </div>
                <dd className="font-serif text-[19px] font-semibold text-cream">
                  {dimension.earned} / {dimension.maximum}
                </dd>
              </div>
            );
          })}
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-[16px] font-semibold text-cream">Total</dt>
            <dd className="font-serif text-[30px] leading-none font-semibold text-cream">
              {receipt.score.total} / 1,000
            </dd>
          </div>
        </dl>

        <section className="mt-10" aria-labelledby="pattern-title">
          <h2
            id="pattern-title"
            className="font-label text-[11px] tracking-[0.14em] text-cream/70"
          >
            Based on a documented pattern
          </h2>
          <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-cream/90">
            {receipt.sourceNote.pattern}
          </p>
          <p className="mt-3 text-[12px] text-cream/60">
            <a
              href={receipt.sourceNote.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 underline decoration-cream/35 underline-offset-4"
            >
              {receipt.sourceNote.source}, {receipt.sourceNote.year}
              <ExternalLink size={12} strokeWidth={2} aria-hidden className="text-gold" />
            </a>
          </p>
          <hr className="mt-4 max-w-[46rem] border-0 border-t border-cream-dim/20" />
          <p className="mt-3 max-w-[62ch] text-[12px] leading-relaxed text-cream/70 italic">
            Names, amounts and organisations in this case are fictional. The figures
            above are reported national totals.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="truth-title">
          <h2 id="truth-title" className="font-serif text-[24px] font-semibold text-cream">
            Truth: {VERDICT_LABELS[receipt.truth]}
          </h2>
          <p className="mt-2 max-w-[62ch] text-[16px] leading-relaxed text-cream/90">{receipt.lesson}</p>
          <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-cream/90">
            <span className="font-semibold">Real-world action: </span>
            {receipt.realWorldAction}
          </p>
          <a
            href={receipt.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-[44px] max-w-[46rem] items-center gap-2 text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
          >
            {receipt.sourceLabel}
            <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
          </a>
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={onReplay}
            className="surface-cream inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-cream px-6 font-sans text-[16px] font-semibold text-ink"
          >
            Retry this case
          </button>
          <Link
            href="/"
            className="min-h-[44px] font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
          >
            Return to the table
          </Link>
          <Link
            href="/board"
            className="min-h-[44px] font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
          >
            Open the board
          </Link>
        </div>
      </main>
    </>
  );
}
