"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ArtifactCard } from "@/components/ArtifactCard";
import { SoundToggle } from "@/components/SoundToggle";
import { Wordmark } from "@/components/Wordmark";
import { getEnabledCases } from "@/lib/cases/registry";
import { DEAL_DURATION, DEAL_STAGGER, EASE_DEAL } from "@/lib/motion";
import { seededRotation } from "@/lib/seededRotation";

const ENABLED_CASES = getEnabledCases();
const FIRST = ENABLED_CASES[0];
const HERO_ARTIFACT_IDS = ["offer-email", "supplied-call", "official-directory"];

export function LandingHero() {
  const reduce = useReducedMotion();
  const heroArtifacts = HERO_ARTIFACT_IDS.flatMap((id) => {
    const artifact = FIRST.artifacts.find((candidate) => candidate.id === id);
    return artifact ? [artifact] : [];
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-10 sm:px-5">
      <div className="flex items-center justify-between gap-4 py-4">
        <Wordmark />
        <SoundToggle />
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
            find a source they did not hand you, and build a Trust Chain you can defend.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link
              href={`/play/${FIRST.id}`}
              className="surface-cream inline-flex min-h-[52px] items-center gap-2 rounded-[12px] bg-cream px-7 font-sans text-[17px] font-semibold text-ink transition-shadow duration-150 hover:shadow-[0_6px_16px_rgba(20,40,30,0.45)]"
            >
              Deal me in
              <ArrowRight size={20} strokeWidth={2} aria-hidden />
            </Link>
          </div>

          <p className="mt-8 max-w-[46ch] text-[14px] leading-relaxed text-cream/60">
            Practice with invented people and organizations. No real offer,
            account, or personal information is needed.
          </p>
        </div>

        <div className="w-full lg:flex-1">
          <p className="font-label text-[12px] tracking-[0.08em] text-cream/70">
            Case 1 of {ENABLED_CASES.length}, {FIRST.shortTitle}
          </p>
          <div className="mt-4 flex origin-left scale-[0.62] items-start gap-3 min-[420px]:scale-[0.74] min-[560px]:scale-90 lg:scale-100 lg:justify-center">
            {heroArtifacts.map((artifact, index) => (
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
                  band="unknown"
                  label={artifact.title}
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
