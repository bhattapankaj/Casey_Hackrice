"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ArtifactCard } from "@/components/ArtifactCard";
import { SoundToggle } from "@/components/SoundToggle";
import { Wordmark } from "@/components/Wordmark";
import { CASES, CASE_TOTAL, caseNumber } from "@/lib/cases";
import {
  DEAL_DURATION,
  DEAL_STAGGER,
  EASE_DEAL,
} from "@/lib/motion";
import { seededRotation } from "@/lib/seededRotation";
import {
  completedCount,
  nextUnplayedCase,
  readSession,
  resetRun,
} from "@/lib/session";

const FIRST = CASES["case-01"];

export function LandingHero() {
  const reduce = useReducedMotion();
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = readSession();
    const count = completedCount(session);
    setDone(count);
    setResumeId(count > 0 ? (nextUnplayedCase(session) ?? null) : null);
    setReady(true);
  }, []);

  const returning = ready && done > 0;
  const runComplete = returning && resumeId === null;
  const primaryHref = returning && resumeId ? `/play/${resumeId}` : "/play/case-01";
  const primaryLabel = runComplete
    ? "See your run"
    : returning && resumeId
      ? `Continue case ${caseNumber(resumeId)} of ${CASE_TOTAL}`
      : "Deal me in";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-10 sm:px-5">
      <div className="flex items-center justify-between gap-4 py-4">
        <Wordmark />
        <div className="flex items-center gap-5">
          <SoundToggle />
          <Link
            href="/board"
            className="min-h-[44px] content-center font-label text-[12px] tracking-[0.08em] text-cream/80 transition-colors duration-150 hover:text-cream"
          >
            The board
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-start gap-8 py-4 lg:flex-row lg:items-center lg:gap-12">
        <div className="w-full lg:max-w-[30rem]">
          <h1 className="font-serif text-[34px] leading-[1.1] font-semibold text-cream sm:text-[47px]">
            Take the call.
            <br />
            Verify everything.
          </h1>

          <p className="mt-4 max-w-[42ch] text-[16px] leading-relaxed text-cream/90">
            Somebody is about to ask you to confirm something. Open the evidence,
            find a source they did not hand you, and call it.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link
              href={runComplete ? "/board" : primaryHref}
              className="surface-cream inline-flex min-h-[52px] items-center gap-2 rounded-[12px] bg-cream px-7 font-sans text-[17px] font-semibold text-ink transition-shadow duration-150 hover:shadow-[0_6px_16px_rgba(20,40,30,0.45)]"
            >
              {primaryLabel}
              <ArrowRight size={20} strokeWidth={2} aria-hidden />
            </Link>

            {returning ? (
              <button
                type="button"
                onClick={() => {
                  resetRun();
                  setDone(0);
                  setResumeId(null);
                }}
                className="min-h-[44px] font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
              >
                Start a new run
              </button>
            ) : null}
          </div>

          {returning ? (
            <p className="mt-4 text-[16px] text-cream/75">
              {done} of {CASE_TOTAL} cases complete on this device.
            </p>
          ) : null}

          <p className="mt-8 max-w-[46ch] text-[14px] leading-relaxed text-cream/60">
            A fictional simulation. Every person, employer, address, and phone
            number in Casey is invented. Nothing here is a real offer, and no
            real accounts are involved.
          </p>
        </div>

        {/* The actual first case, face up and ready to be dealt. */}
        <div className="w-full lg:flex-1">
          <p className="font-label text-[12px] tracking-[0.08em] text-cream/70">
            Case 1 of {CASE_TOTAL}, {FIRST.shortTitle}
          </p>
          <div className="mt-4 flex origin-left scale-[0.62] items-start gap-3 min-[420px]:scale-[0.74] min-[560px]:scale-90 lg:scale-100 lg:justify-center">
            {FIRST.artifacts.map((artifact, index) => (
              <motion.div
                key={artifact.id}
                initial={{ x: 160, y: -40, rotate: 10, opacity: 0 }}
                animate={{
                  x: 0,
                  y: index === 1 ? -14 : 0,
                  rotate: seededRotation(artifact.id),
                  opacity: 1,
                }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        duration: DEAL_DURATION,
                        delay: 0.15 + index * DEAL_STAGGER,
                        ease: EASE_DEAL,
                      }
                }
              >
                <ArtifactCard
                  channel={artifact.channel}
                  band={artifact.band}
                  label={artifact.label}
                  state="unopened"
                  interactive={false}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
