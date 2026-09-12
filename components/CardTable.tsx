"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArtifactCard } from "@/components/ArtifactCard";
import { ArtifactViewer } from "@/components/ArtifactViewer";
import { Receipt } from "@/components/Receipt";
import { SiteNav } from "@/components/SiteNav";
import { VerdictChip } from "@/components/VerdictChip";
import type { GameCase, Verdict } from "@/lib/cases";
import { DEAL_DURATION, DEAL_STAGGER, EASE_DEAL, REDUCE_DURATION } from "@/lib/motion";
import { seededRotation } from "@/lib/seededRotation";
import { readSession } from "@/lib/session";

type CardTableProps = {
  gameCase: GameCase;
};

export function CardTable({ gameCase }: CardTableProps) {
  const reduce = useReducedMotion();
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [baseScore, setBaseScore] = useState(gameCase.startingScore);

  useEffect(() => {
    setBaseScore(readSession().score);
  }, []);

  const activeArtifact =
    gameCase.artifacts.find((artifact) => artifact.id === activeId) ?? null;
  const openedArtifacts = gameCase.artifacts.filter((artifact) =>
    openedIds.includes(artifact.id),
  );

  const openArtifact = useCallback((id: string) => {
    setOpenedIds((current) => (current.includes(id) ? current : [...current, id]));
    setActiveId(id);
  }, []);

  const closeArtifact = useCallback(() => {
    const returning = activeId;
    setActiveId(null);
    window.setTimeout(() => {
      if (returning) {
        document.getElementById(`card-${returning}`)?.focus();
      }
    }, 50);
  }, [activeId]);

  const selectVerdict = useCallback((next: Verdict) => {
    if (verdict) {
      return;
    }
    setActiveId(null);
    setVerdict(next);
    window.setTimeout(
      () => {
        setShowReceipt(true);
      },
      reduce ? 120 : 420,
    );
  }, [reduce, verdict]);

  const replay = useCallback(() => {
    setOpenedIds([]);
    setActiveId(null);
    setVerdict(null);
    setShowReceipt(false);
    setAnnounce("");
    setBaseScore(readSession().score);
  }, []);

  if (showReceipt && verdict) {
    return (
      <Receipt
        gameCase={gameCase}
        verdict={verdict}
        opened={openedArtifacts}
        baseScore={baseScore}
        onReplay={replay}
      />
    );
  }

  return (
    <LayoutGroup>
      <SiteNav />
      <main className="mx-auto flex min-h-screen w-full max-w-[1040px] flex-col px-5 pt-6 pb-52">
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announce}
        </div>

        <header className="flex flex-col gap-3 min-[600px]:flex-row min-[600px]:items-start min-[600px]:justify-between">
          <h1 className="max-w-[18ch] font-serif text-[24px] leading-tight font-semibold text-cream">
            {gameCase.title}
          </h1>
          <p
            className="font-serif text-[37px] leading-none font-semibold text-gold"
            aria-label={`Score ${baseScore}`}
          >
            {baseScore}
          </p>
        </header>

        <div className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-cream/90">
          {gameCase.briefing.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-start justify-center gap-[28px] min-[760px]:flex-nowrap">
          {gameCase.artifacts.map((artifact, index) => {
            const seed = seededRotation(artifact.id);
            const isActive = activeId === artifact.id;
            const state = openedIds.includes(artifact.id) ? "opened" : "available";

            return (
              <motion.div
                key={artifact.id}
                initial={reduce ? { opacity: 0 } : { x: 320, y: -60, rotate: 12, opacity: 0 }}
                animate={
                  reduce
                    ? { opacity: 1 }
                    : { x: 0, y: 0, rotate: seed, opacity: 1 }
                }
                transition={
                  reduce
                    ? { duration: REDUCE_DURATION, ease: "easeOut" }
                    : {
                        duration: DEAL_DURATION,
                        delay: index * DEAL_STAGGER,
                        ease: EASE_DEAL,
                      }
                }
              >
                {isActive ? (
                  <div className="aspect-[3/4] w-[180px]" aria-hidden />
                ) : (
                  <ArtifactCard
                    id={`card-${artifact.id}`}
                    channel={artifact.channel}
                    band={artifact.band}
                    label={artifact.label}
                    state={state}
                    onOpen={() => openArtifact(artifact.id)}
                    layoutId={reduce ? undefined : `artifact-${artifact.id}`}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-auto pt-16">
          <div className="h-px w-full bg-cream/15" />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center gap-3 px-3 pt-4 pb-5 min-[520px]:gap-10 min-[520px]:px-4 min-[520px]:pb-6">
          <VerdictChip verdict="scam" selected={verdict} onSelect={selectVerdict} />
          <VerdictChip verdict="legit" selected={verdict} onSelect={selectVerdict} />
          <VerdictChip verdict="more" selected={verdict} onSelect={selectVerdict} />
        </div>
      </main>

      <AnimatePresence>
        {activeArtifact ? (
          <ArtifactViewer
            key={activeArtifact.id}
            artifact={activeArtifact}
            onClose={closeArtifact}
            onAnnounce={setAnnounce}
          />
        ) : null}
      </AnimatePresence>
    </LayoutGroup>
  );
}
