"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { Pin, TriangleAlert } from "lucide-react";
import { ArtifactCard } from "@/components/ArtifactCard";
import { ArtifactViewer } from "@/components/ArtifactViewer";
import { Receipt } from "@/components/Receipt";
import { SiteNav } from "@/components/SiteNav";
import { CHIP_COPY, VERDICT_ORDER, VerdictChip } from "@/components/VerdictChip";
import { CASE_TOTAL, caseNumber, type GameCase, type Verdict } from "@/lib/cases";
import {
  DEAL_DURATION,
  DEAL_STAGGER,
  EASE_DEAL,
  HOVER_DURATION,
} from "@/lib/motion";
import { seededRotation } from "@/lib/seededRotation";
import { readSession } from "@/lib/session";
import { play } from "@/lib/sound";

type CardTableProps = {
  gameCase: GameCase;
};

/** Two cards fit a phone row, three fit once there is room. */
const CARD_WIDTH = "w-[158px] min-[430px]:w-[170px] min-[780px]:w-[190px]";

export function CardTable({ gameCase }: CardTableProps) {
  const reduce = useReducedMotion();
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [choice, setChoice] = useState<Verdict | null>(null);
  const [committed, setCommitted] = useState<Verdict | null>(null);
  const [warning, setWarning] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [baseScore, setBaseScore] = useState(gameCase.startingScore);
  const [dealKey, setDealKey] = useState(0);
  const warningRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setBaseScore(readSession().score);
  }, []);

  // One card sound per dealt card, in step with the deal animation.
  useEffect(() => {
    if (showReceipt) {
      return;
    }
    const step = reduce ? 40 : DEAL_STAGGER * 1000;
    const timers = gameCase.artifacts.map((_, index) =>
      window.setTimeout(() => play("deal"), index * step),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dealKey, showReceipt, gameCase.artifacts, reduce]);

  useEffect(() => {
    if (warning) {
      warningRef.current?.focus();
    }
  }, [warning]);

  const activeArtifact =
    gameCase.artifacts.find((artifact) => artifact.id === activeId) ?? null;
  const openedArtifacts = gameCase.artifacts.filter((artifact) =>
    openedIds.includes(artifact.id),
  );

  const pinned = useMemo(
    () =>
      gameCase.artifacts.flatMap((artifact) =>
        artifact.excerpts
          .filter((excerpt) => pinnedIds.includes(excerpt.id))
          .map((excerpt) => ({ artifact, excerpt })),
      ),
    [gameCase.artifacts, pinnedIds],
  );

  const openArtifact = useCallback((id: string) => {
    play("open");
    setOpenedIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setActiveId(id);
  }, []);

  const closeArtifact = useCallback(() => {
    const returning = activeId;
    play("close");
    setActiveId(null);
    window.setTimeout(() => {
      if (returning) {
        document.getElementById(`card-${returning}`)?.focus();
      }
    }, 50);
  }, [activeId]);

  const togglePin = useCallback((excerptId: string) => {
    setPinnedIds((current) =>
      current.includes(excerptId)
        ? current.filter((id) => id !== excerptId)
        : [...current, excerptId],
    );
  }, []);

  const chooseVerdict = useCallback(
    (next: Verdict) => {
      if (committed) {
        return;
      }
      play("chip");
      setWarning(false);
      setChoice((current) => (current === next ? null : next));
    },
    [committed],
  );

  const commit = useCallback(
    (verdict: Verdict) => {
      setCommitted(verdict);
      setWarning(false);
      setActiveId(null);
      play("pot");
      setAnnounce(`Verdict submitted: ${CHIP_COPY[verdict].label}.`);
      window.setTimeout(() => setShowReceipt(true), reduce ? 120 : 420);
    },
    [reduce],
  );

  const submit = useCallback(() => {
    if (!choice || committed) {
      return;
    }
    if (openedIds.length === 0) {
      setWarning(true);
      return;
    }
    commit(choice);
  }, [choice, committed, openedIds.length, commit]);

  const replay = useCallback(() => {
    setOpenedIds([]);
    setPinnedIds([]);
    setActiveId(null);
    setChoice(null);
    setCommitted(null);
    setWarning(false);
    setShowReceipt(false);
    setAnnounce("");
    setBaseScore(readSession().score);
    setDealKey((key) => key + 1);
  }, []);

  if (showReceipt && committed) {
    return (
      <Receipt
        gameCase={gameCase}
        verdict={committed}
        opened={openedArtifacts}
        baseScore={baseScore}
        onReplay={replay}
      />
    );
  }

  const spotChip = committed ?? choice;

  return (
    <LayoutGroup>
      <SiteNav />
      <main className="mx-auto flex min-h-screen w-full max-w-[1040px] flex-col px-4 pt-4 pb-16 sm:px-5">
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announce}
        </div>

        {/* Compact header: where you are, what you have seen, what you have scored. */}
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-cream/15 pb-4">
          <div className="min-w-0">
            <p className="font-label text-[12px] tracking-[0.08em] text-cream/70">
              Case {caseNumber(gameCase.id)} of {CASE_TOTAL}
            </p>
            <h1 className="mt-1 font-serif text-[26px] leading-tight font-semibold text-cream sm:text-[30px]">
              {gameCase.title}
            </h1>
          </div>
          <dl className="flex items-end gap-6">
            <div>
              <dt className="font-label text-[12px] tracking-[0.08em] text-cream/70">
                Evidence viewed
              </dt>
              <dd className="mt-1 font-serif text-[24px] leading-none font-semibold text-cream">
                {openedIds.length}
                <span className="text-cream/60"> of {gameCase.artifacts.length}</span>
              </dd>
            </div>
            <div>
              <dt className="font-label text-[12px] tracking-[0.08em] text-cream/70">
                Run total
              </dt>
              <dd className="mt-1 font-serif text-[24px] leading-none font-semibold text-cream">
                {baseScore}
              </dd>
            </div>
          </dl>
        </header>

        <div className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-cream/90">
          {gameCase.briefing.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <h2 className="mt-8 font-label text-[12px] tracking-[0.08em] text-cream/70">
          The evidence
        </h2>

        <div className="mt-4 flex flex-wrap items-start justify-center gap-5 min-[780px]:flex-nowrap min-[780px]:gap-7">
          {gameCase.artifacts.map((artifact, index) => {
            const seed = seededRotation(artifact.id);
            const isActive = activeId === artifact.id;
            const viewed = openedIds.includes(artifact.id);

            return (
              <motion.div
                key={artifact.id}
                /* initial stays identical on server and client. Reduced motion is
                   expressed only through the transition, so nothing travels. */
                initial={{ x: 320, y: -60, rotate: 12, opacity: 0 }}
                animate={{ x: 0, y: 0, rotate: seed, opacity: 1 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        duration: DEAL_DURATION,
                        delay: index * DEAL_STAGGER,
                        ease: EASE_DEAL,
                      }
                }
                whileHover={
                  reduce || isActive
                    ? undefined
                    : {
                        rotate: 0,
                        y: -10,
                        transition: { duration: HOVER_DURATION, ease: "easeOut" },
                      }
                }
              >
                {isActive ? (
                  <div className={`aspect-[3/4] ${CARD_WIDTH}`} aria-hidden />
                ) : (
                  <ArtifactCard
                    id={`card-${artifact.id}`}
                    channel={artifact.channel}
                    band={artifact.band}
                    label={artifact.label}
                    state={viewed ? "viewed" : "unopened"}
                    preview={artifact.preview}
                    width={CARD_WIDTH}
                    onOpen={() => openArtifact(artifact.id)}
                    layoutId={`artifact-${artifact.id}`}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        <section
          aria-labelledby="pinned-heading"
          className="mt-7 rounded-[12px] border border-cream/15 bg-felt-deep/40 p-4"
        >
          <h2
            id="pinned-heading"
            className="flex items-center gap-2 font-label text-[12px] tracking-[0.08em] text-cream/70"
          >
            <Pin size={14} strokeWidth={2} aria-hidden />
            Pinned evidence
            <span className="text-cream/50">({pinned.length})</span>
          </h2>
          {pinned.length === 0 ? (
            <p className="mt-2 max-w-[60ch] text-[16px] text-cream/80">
              Open a card and pin the details you want to compare. Pinning is for
              your own notes and does not affect your score.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {pinned.map(({ artifact, excerpt }) => (
                <li key={excerpt.id}>
                  <button
                    type="button"
                    onClick={() => togglePin(excerpt.id)}
                    aria-label={`Unpin: ${excerpt.text}`}
                    className="flex min-h-[44px] w-full items-start gap-3 rounded-[8px] border border-cream/20 px-3 py-2 text-left transition-colors duration-150 hover:bg-cream/10"
                  >
                    <span className="mt-0.5 shrink-0 font-label text-[11px] tracking-[0.08em] text-cream/60">
                      {artifact.label}
                    </span>
                    <span className="text-[16px] leading-snug text-cream">
                      {excerpt.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Verdict sits directly under the evidence, not in a detached bar. */}
        <section
          aria-labelledby="verdict-heading"
          className="relative mt-9 flex flex-col items-center"
        >
          {/* Printed betting line, the way a felt is marked. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-5 mx-auto h-10 w-full max-w-[680px] rounded-t-[100%] border-t border-cream/12"
          />

          <h2
            id="verdict-heading"
            className="font-label text-[12px] tracking-[0.08em] text-cream/70"
          >
            Your verdict
          </h2>

          {/* The marked spot the chip is pushed into. */}
          <div className="mt-4 flex flex-col items-center">
            <div
              className={`flex size-[84px] items-center justify-center rounded-full border border-dashed transition-colors duration-150 ${
                spotChip ? "border-cream/40" : "border-cream/25"
              }`}
            >
              {spotChip ? (
                <VerdictChip
                  verdict={spotChip}
                  selected={spotChip}
                  committed={committed !== null}
                  onSelect={chooseVerdict}
                  inSpot
                />
              ) : (
                <span className="max-w-[4.5rem] text-center font-label text-[10px] leading-tight tracking-[0.08em] text-cream/45">
                  Verdict spot
                </span>
              )}
            </div>
            <p className="mt-2 h-5 text-[14px] text-cream/80">
              {spotChip ? CHIP_COPY[spotChip].label : "No chip placed"}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-start justify-center gap-4 sm:gap-8">
            {VERDICT_ORDER.map((verdict) =>
              spotChip === verdict ? (
                <div key={verdict} className="w-[68px]" aria-hidden />
              ) : (
                <VerdictChip
                  key={verdict}
                  verdict={verdict}
                  selected={choice}
                  committed={committed !== null}
                  onSelect={chooseVerdict}
                />
              ),
            )}
          </div>

          <p className="mt-5 max-w-[52ch] text-center text-[16px] text-cream/75">
            Insufficient evidence is a final answer, not a hint. Choose it when
            the evidence genuinely cannot settle the question.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={submit}
              disabled={!choice || committed !== null}
              className="surface-cream inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-cream px-6 font-sans text-[16px] font-semibold text-ink transition-shadow duration-150 hover:shadow-[0_4px_12px_rgba(20,40,30,0.4)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Submit verdict
            </button>
            <button
              type="button"
              onClick={() => {
                setChoice(null);
                setWarning(false);
              }}
              disabled={committed !== null}
              className="min-h-[44px] font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4 disabled:opacity-45"
            >
              Keep investigating
            </button>
          </div>

          {warning && choice ? (
            <div
              role="alertdialog"
              aria-labelledby="warn-title"
              aria-describedby="warn-body"
              className="surface-cream mt-5 w-full max-w-[36rem] rounded-[12px] bg-cream p-4 text-ink"
            >
              <h3
                id="warn-title"
                className="flex items-center gap-2 font-serif text-[19px] font-semibold"
              >
                <TriangleAlert size={20} strokeWidth={2} aria-hidden className="text-red" />
                Submit without opening any evidence?
              </h3>
              <p id="warn-body" className="mt-2 text-[16px] leading-relaxed text-ink/80">
                You have not opened a single card, so this case will score
                nothing even if the verdict happens to be right.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <button
                  ref={warningRef}
                  type="button"
                  onClick={() => commit(choice)}
                  className="inline-flex min-h-[44px] items-center rounded-[12px] bg-ink px-5 font-sans text-[16px] font-semibold text-cream"
                >
                  Submit anyway
                </button>
                <button
                  type="button"
                  onClick={() => setWarning(false)}
                  className="min-h-[44px] font-sans text-[16px] font-semibold text-ink underline decoration-ink/40 underline-offset-4"
                >
                  Keep investigating
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </main>

      <AnimatePresence>
        {activeArtifact ? (
          <ArtifactViewer
            key={activeArtifact.id}
            artifact={activeArtifact}
            pinnedIds={pinnedIds}
            onTogglePin={togglePin}
            onClose={closeArtifact}
            onAnnounce={setAnnounce}
          />
        ) : null}
      </AnimatePresence>
    </LayoutGroup>
  );
}
