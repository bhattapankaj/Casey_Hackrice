"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { ArtifactCard } from "@/components/ArtifactCard";
import { SiteNav } from "@/components/SiteNav";
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
import { applyCaseDelta } from "@/lib/session";
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

  useEffect(() => {
    applyCaseDelta(gameCase.id, model.delta);
  }, [gameCase.id, model.delta]);

  // The showdown: one card turns over at a time, each sounding as it snaps face up.
  // Keyed on the count, not the array, so a re-render cannot cancel the sequence.
  const chainLength = opened.length;
  useEffect(() => {
    const step = reduce ? 40 : RECEIPT_STAGGER * 1000;
    const snap = reduce ? 0 : (RECEIPT_FLIP * 1000) / 2;
    const timers = Array.from({ length: chainLength }, (_, index) =>
      window.setTimeout(() => play("reveal"), snap + index * step),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [chainLength, reduce]);

  return (
    <>
    <SiteNav />
    <main className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col px-5 py-8">
      <h1 className="font-serif text-[24px] font-semibold text-cream">
        Your evidence chain
      </h1>

      {opened.length === 0 ? (
        <p className="mt-10 max-w-[36rem] text-[16px] text-cream/90">
          There are no cards in this chain. Open evidence on the table
          before you call a verdict.
        </p>
      ) : (
        <div className="mt-10 flex flex-wrap items-center justify-center">
          {opened.map((artifact, index) => (
            <div key={artifact.id} className="flex items-center">
              {index > 0 ? (
                <div className="mx-1 h-px w-6 bg-cream/15 min-[520px]:w-10" aria-hidden />
              ) : null}
              <motion.div
                className="relative h-[144px] w-[108px]"
                style={{ perspective: 900 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: reduce ? REDUCE_DURATION : RECEIPT_DURATION,
                  delay: reduce ? 0 : index * RECEIPT_STAGGER,
                  ease: EASE_DEAL,
                }}
              >
                <motion.div
                  className="relative h-full w-full"
                  style={{ transformStyle: "preserve-3d" }}
                  initial={reduce ? false : { rotateY: 180 }}
                  animate={{ rotateY: 0 }}
                  transition={{
                    duration: reduce ? 0 : RECEIPT_FLIP,
                    delay: reduce ? 0 : index * RECEIPT_STAGGER,
                    ease: EASE_OPEN,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="origin-top-left scale-[0.6]">
                      <ArtifactCard
                        channel={artifact.channel}
                        band={artifact.band}
                        label={artifact.label}
                        state="opened"
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
                    <div className="origin-top-left scale-[0.6]">
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
          ))}
        </div>
      )}

      <p className="mt-12 max-w-[22ch] font-serif text-[30px] leading-snug font-semibold text-cream">
        {model.summary}
      </p>

      <ul className="mt-8 max-w-[36rem] space-y-3">
        {model.lines.map((line) => (
          <li key={line.text} className="flex items-start gap-3 text-[15px] text-cream">
            {line.ok ? (
              <Check size={20} strokeWidth={1.75} className="mt-0.5 text-gold" aria-hidden />
            ) : (
              <X size={20} strokeWidth={1.75} className="mt-0.5 text-red" aria-hidden />
            )}
            <span>
              {line.text}
              {line.delta !== 0 ? (
                <span className="font-serif text-[19px] text-gold">
                  {" "}
                  {line.delta > 0 ? `+${line.delta}` : line.delta}
                </span>
              ) : null}
            </span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-4 border-t border-cream/15 pt-3">
          <span className="font-sans text-[15px] text-cream">Score</span>
          <span className="font-serif text-[37px] leading-none font-semibold text-gold">
            {model.total}
          </span>
        </li>
      </ul>

      <p className="mt-8 max-w-[36rem] text-[16px] leading-relaxed text-cream/90">
        {model.lesson}
      </p>

      <a
        href={model.realWorldLink}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex max-w-[36rem] items-center gap-2 text-[15px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
      >
        {model.realWorldLabel}
        <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
      </a>

      <div className="mt-10 flex flex-wrap items-center gap-5">
        {nextId ? (
          <Link
            href={`/play/${nextId}`}
            className="inline-flex items-center gap-2 rounded-[12px] bg-cream px-5 py-3 font-sans text-[15px] font-semibold text-ink"
          >
            Deal the next case
            <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
          </Link>
        ) : (
          <Link
            href="/board"
            className="inline-flex items-center gap-2 rounded-[12px] bg-cream px-5 py-3 font-sans text-[15px] font-semibold text-ink"
          >
            Post my score
            <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
          </Link>
        )}
        <button
          type="button"
          onClick={onReplay}
          className="font-sans text-[15px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
        >
          Deal this case again
        </button>
        <Link
          href="/board"
          className="font-sans text-[15px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
        >
          See the board
        </Link>
      </div>
    </main>
    </>
  );
}
