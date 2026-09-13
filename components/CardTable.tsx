"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { Pin, TriangleAlert } from "lucide-react";
import { ArtifactCard } from "@/components/ArtifactCard";
import { ArtifactViewer } from "@/components/ArtifactViewer";
import { CallPanel, CompactCallControls } from "@/components/CallPanel";
import { IdFormConfirm } from "@/components/IdFormConfirm";
import { InfoTip } from "@/components/InfoTip";
import { Receipt } from "@/components/Receipt";
import { SiteNav } from "@/components/SiteNav";
import { CHIP_COPY, VERDICT_ORDER, VerdictChip } from "@/components/VerdictChip";
import { useCaseyVoice } from "@/hooks/useCaseyVoice";
import { useGameSession } from "@/hooks/useGameSession";
import { usePlayerName } from "@/hooks/usePlayerName";
import { getEnabledCases } from "@/lib/cases/registry";
import type { CaseFile, Verdict } from "@/lib/cases/schema";
import { scoreCatalogRound } from "@/lib/engine/catalog-score";
import { handForRound } from "@/lib/engine/hand-from-session";
import { DEFAULT_STAKE, type Stake } from "@/lib/engine/chips";
import { postCurrentBoard } from "@/lib/board/client";
import { persistCaseResult, readStoredProgress } from "@/lib/progress";
import { StakeControl } from "@/components/StakeControl";
import type { Hand } from "@/lib/engine/hand";
import {
  DEAL_DURATION,
  DEAL_STAGGER,
  EASE_DEAL,
  HOVER_DURATION,
} from "@/lib/motion";
import { seededRotation } from "@/lib/seededRotation";
import { sourceClassToBand } from "@/lib/cases/public-case";
import { play } from "@/lib/sound";

type CardTableProps = {
  gameCase: CaseFile;
};

type CardTableGameProps = CardTableProps & {
  playerName: string;
};

const CARD_WIDTH = "w-[158px] min-[430px]:w-[170px] min-[780px]:w-[190px]";

export function CardTable({ gameCase }: CardTableProps) {
  const player = usePlayerName();

  if (!player.ready) {
    return (
      <>
        <SiteNav />
        <main className="mx-auto min-h-screen w-full max-w-[680px] px-4 py-16 text-cream sm:px-5">
          <p role="status">Preparing your case...</p>
        </main>
      </>
    );
  }

  return (
    <ConversationProvider>
      <CardTableGame gameCase={gameCase} playerName={player.name ?? "You"} />
    </ConversationProvider>
  );
}

function CardTableGame({ gameCase, playerName }: CardTableGameProps) {
  const reduce = useReducedMotion();
  const game = useGameSession(gameCase);
  const voice = useCaseyVoice({
    caseId: gameCase.id,
    maxCallSeconds: gameCase.caller?.maxCallSeconds ?? 75,
    selectMode: game.selectMode,
    dealPressureCard: game.dealPressureCard,
  });
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [choice, setChoice] = useState<Verdict | null>(null);
  const [stake, setStake] = useState<Stake>(DEFAULT_STAKE);
  const [warning, setWarning] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [dealKey, setDealKey] = useState(0);
  const [pendingSubmitId, setPendingSubmitId] = useState<string | null>(null);
  const [settlement, setSettlement] = useState<{
    hand: Hand;
    explanation: string;
    stake: Stake;
    chipsBefore: number;
    chipsAfter: number;
    correct: boolean;
  } | null>(null);
  const previousCardCount = useRef(0);
  const warningRef = useRef<HTMLButtonElement>(null);
  const recordedResult = useRef<string | null>(null);

  useEffect(() => {
    if (showReceipt) return;
    const added = Math.max(0, game.revealedArtifacts.length - previousCardCount.current);
    const step = reduce ? 40 : DEAL_STAGGER * 1000;
    const timers = Array.from({ length: added }, (_, index) =>
      window.setTimeout(() => play("deal"), index * step),
    );
    previousCardCount.current = game.revealedArtifacts.length;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dealKey, game.revealedArtifacts.length, reduce, showReceipt]);

  useEffect(() => {
    if (warning) warningRef.current?.focus();
  }, [warning]);

  const activeArtifact =
    game.revealedArtifacts.find((artifact) => artifact.id === activeId) ?? null;
  const committed = game.session.verdict ?? null;

  const openArtifact = useCallback((id: string) => {
    play("open");
    setViewedIds((current) => (current.includes(id) ? current : [...current, id]));
    setActiveId(id);
  }, []);

  const closeArtifact = useCallback(() => {
    const returning = activeId;
    play("close");
    setActiveId(null);
    window.setTimeout(() => {
      if (returning) document.getElementById(`card-${returning}`)?.focus();
    }, 50);
  }, [activeId]);

  const chooseVerdict = useCallback(
    (next: Verdict) => {
      if (committed) return;
      play("chip");
      setWarning(false);
      setChoice((current) => (current === next ? null : next));
    },
    [committed],
  );

  const confirmVerdict = useCallback(() => {
    if (!choice || committed) return;
    const chipsBefore = readStoredProgress().chips;
    const previous = readStoredProgress().cases[gameCase.id];
    const firstAttempt = !previous || previous.attempts === 0;
    voice.end();
    game.commitVerdict(choice);
    const projected = {
      ...game.session,
      verdict: choice,
      timestamps: {
        ...game.session.timestamps,
        committedAt: new Date().toISOString(),
      },
    };
    const round = scoreCatalogRound(gameCase, projected);
    const ranked = handForRound(gameCase, projected, round.correct, firstAttempt);
    const chipsAfter = round.correct
      ? chipsBefore + stake
      : Math.max(0, chipsBefore - stake);
    setSettlement({
      hand: ranked.hand,
      explanation: ranked.explanation,
      stake,
      chipsBefore,
      chipsAfter,
      correct: round.correct,
    });
    setWarning(false);
    setActiveId(null);
    play("submit");
    setAnnounce(`Verdict submitted: ${CHIP_COPY[choice].label}.`);
    window.setTimeout(() => setShowReceipt(true), reduce ? 120 : 420);
  }, [choice, committed, game, gameCase, reduce, stake, voice]);

  const submit = useCallback(() => {
    if (!choice || committed) return;
    setWarning(true);
  }, [choice, committed]);

  const replay = useCallback(() => {
    voice.reset();
    game.reset();
    previousCardCount.current = 0;
    setViewedIds([]);
    setActiveId(null);
    setChoice(null);
    setStake(DEFAULT_STAKE);
    setWarning(false);
    setShowReceipt(false);
    setSettlement(null);
    setAnnounce("");
    setDealKey((key) => key + 1);
    setPendingSubmitId(null);
    recordedResult.current = null;
  }, [game, voice]);

  useEffect(() => {
    if (!showReceipt || !game.receipt || !game.session.verdict || !settlement) {
      return;
    }
    const key = `${game.session.timestamps.committedAt ?? ""}:${game.session.verdict}`;
    if (recordedResult.current === key) {
      return;
    }
    recordedResult.current = key;
    const round = scoreCatalogRound(gameCase, game.session);
    const stored = persistCaseResult({
      caseId: gameCase.id,
      verdict: game.session.verdict,
      score: round.total,
      correct: round.correct,
      usedOutOfBand: round.usedOutOfBand,
      pinnedArtifactIds: game.session.pinnedArtifactIds,
      hand: settlement.hand,
      stake: settlement.stake,
      at: game.session.timestamps.committedAt ?? new Date().toISOString(),
    });
    if (stored.nickname) {
      void postCurrentBoard(stored.nickname);
    }
  }, [game.receipt, game.session, gameCase, settlement, showReceipt]);

  if (showReceipt && game.receipt && settlement) {
    return (
      <Receipt
        receipt={game.receipt}
        playerName={playerName}
        tableScore={scoreCatalogRound(gameCase, game.session).total}
        settlement={settlement}
        onReplay={replay}
      />
    );
  }

  const spotChip = committed ?? choice;
  const outOfChips = readStoredProgress().chips === 0;

  return (
    <LayoutGroup>
      <SiteNav />
      <main className="mx-auto flex min-h-screen w-full max-w-[1040px] flex-col px-4 pt-4 pb-16 sm:px-5">
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announce}
        </div>

        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-cream/15 pb-4">
          <div className="min-w-0">
            <p className="font-label text-[12px] tracking-[0.08em] text-cream/70">
              Case {getEnabledCases().findIndex((entry) => entry.id === gameCase.id) + 1} of{" "}
              {getEnabledCases().length}
            </p>
            <h1 className="mt-1 font-serif text-[26px] leading-tight font-semibold text-cream sm:text-[30px]">
              {gameCase.title}
            </h1>
          </div>
          <dl className="flex items-end gap-6">
            <div>
              <dt className="font-label text-[12px] tracking-[0.08em] text-cream/70">Evidence viewed</dt>
              <dd className="mt-1 font-serif text-[24px] leading-none font-semibold text-cream">
                {viewedIds.length}
                <span className="text-cream/60"> of {game.revealedArtifacts.length}</span>
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 font-label text-[12px] tracking-[0.08em] text-cream/70">
                Pinned
                <InfoTip label="pinned evidence" align="end">
                  Pinned evidence is what your verdict is scored on. Opening a card is free.
                </InfoTip>
              </dt>
              <dd className="mt-1 font-serif text-[24px] leading-none font-semibold text-cream">
                {game.pinnedArtifacts.length}
                <span className="text-cream/60"> of 3</span>
              </dd>
            </div>
          </dl>
        </header>

        <div className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-cream/90">
          {gameCase.briefing.map((line, index) => (
            <p key={line}>
              {index === 0 && playerName !== "You" && line.startsWith("You ")
                ? `${playerName}, you ${line.slice(4)}`
                : line}
            </p>
          ))}
        </div>

        <CallPanel
          characterName={gameCase.caller?.characterName ?? "Caller"}
          organizationName={gameCase.caller?.organizationName ?? "Unknown caller"}
          playerName={playerName}
          voice={voice}
        />

        <section className="mt-8" aria-labelledby="investigate-heading">
          <h2 id="investigate-heading" className="font-label text-[12px] tracking-[0.08em] text-cream/70">
            Investigate
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {game.availableActions.length === 0 ? (
              <p className="text-[14px] text-cream/65">All available routes have been checked.</p>
            ) : (
              game.availableActions.map((action) => (
                <button
                  type="button"
                  key={action.id}
                  onClick={() => {
                    if (action.type === "submit") {
                      setPendingSubmitId(action.id);
                      return;
                    }
                    game.takeAction(action.id);
                    setAnnounce(`${action.label} completed.`);
                  }}
                  className={`min-h-[44px] rounded-[10px] border px-4 py-2 text-left font-sans text-[14px] font-semibold text-cream transition-colors duration-150 hover:bg-cream/10 ${
                    pendingSubmitId === action.id
                      ? "border-cream/55 bg-cream/10"
                      : "border-cream/25"
                  }`}
                >
                  {action.label}
                </button>
              ))
            )}
          </div>
          {pendingSubmitId ? (
            <IdFormConfirm
              onConfirm={() => {
                game.takeAction(pendingSubmitId);
                setAnnounce("Fictional ID form sent.");
                setPendingSubmitId(null);
              }}
              onCancel={() => setPendingSubmitId(null)}
            />
          ) : null}
        </section>

        <h2 className="mt-8 font-label text-[12px] tracking-[0.08em] text-cream/70">The evidence</h2>
        <div className="mt-4 flex flex-wrap items-start justify-center gap-5 min-[780px]:gap-7">
          {game.revealedArtifacts.map((artifact, index) => {
            const seed = seededRotation(artifact.id);
            const isActive = activeId === artifact.id;
            const viewed = viewedIds.includes(artifact.id);
            return (
              <motion.div
                key={artifact.id}
                initial={{ x: 320, y: -60, rotate: 12, opacity: 0 }}
                animate={{ x: 0, y: 0, rotate: seed, opacity: 1 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: DEAL_DURATION, delay: index * DEAL_STAGGER, ease: EASE_DEAL }
                }
                whileHover={
                  reduce || isActive
                    ? undefined
                    : { rotate: 0, y: -10, transition: { duration: HOVER_DURATION, ease: "easeOut" } }
                }
              >
                {isActive ? (
                  <div className={`aspect-[3/4] ${CARD_WIDTH}`} aria-hidden />
                ) : (
                  <ArtifactCard
                    id={`card-${artifact.id}`}
                    channel={artifact.channel}
                    band={sourceClassToBand(artifact.sourceClass)}
                    label={artifact.title}
                    state={viewed ? "viewed" : "unopened"}
                    width={CARD_WIDTH}
                    onOpen={() => openArtifact(artifact.id)}
                    layoutId={reduce ? undefined : `artifact-${artifact.id}`}
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
          <h2 id="pinned-heading" className="flex items-center gap-2 font-label text-[12px] tracking-[0.08em] text-cream/70">
            <Pin size={14} strokeWidth={2} aria-hidden />
            Pinned {game.pinnedArtifacts.length} of 3
          </h2>
          {game.pinnedArtifacts.length === 0 ? (
            <p className="mt-2 max-w-[60ch] text-[16px] text-cream/80">
              Open a card and pin only the evidence you are willing to stand behind. Opened cards are not scored.
            </p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2">
              {game.pinnedArtifacts.map((artifact, index) => (
                <li key={artifact.id}>
                  <button
                    type="button"
                    onClick={() => game.unpin(artifact.id)}
                    aria-label={`Unpin ${artifact.title}`}
                    className="flex min-h-[44px] w-full items-start gap-3 rounded-[8px] border border-cream/20 px-3 py-2 text-left transition-colors duration-150 hover:bg-cream/10"
                  >
                    <span className="mt-0.5 shrink-0 font-label text-[11px] tracking-[0.08em] text-cream/60">
                      Pin {index + 1}
                    </span>
                    <span className="text-[16px] leading-snug text-cream">
                      {artifact.title}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="verdict-heading" className="relative mt-9 flex flex-col items-center">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-5 mx-auto h-10 w-full max-w-[680px] rounded-t-[100%] border-t border-cream/12" />
          <h2 id="verdict-heading" className="font-label text-[12px] tracking-[0.08em] text-cream/70">Your verdict</h2>

          <div className="mt-4 flex flex-col items-center">
            <div className={`flex size-[84px] items-center justify-center rounded-full border border-dashed transition-colors duration-150 ${spotChip ? "border-cream/40" : "border-cream/25"}`}>
              {spotChip ? (
                <VerdictChip
                  verdict={spotChip}
                  selected={spotChip}
                  committed={committed !== null}
                  onSelect={chooseVerdict}
                  inSpot
                />
              ) : (
                <span className="max-w-[4.5rem] text-center font-label text-[10px] leading-tight tracking-[0.08em] text-cream/45">Verdict spot</span>
              )}
            </div>
            <p className="mt-2 h-5 text-[14px] text-cream/80">{spotChip ? CHIP_COPY[spotChip].label : "No chip placed"}</p>
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
            Not enough evidence is a final answer, not a hint. Choose it when the evidence genuinely cannot settle the question.
          </p>

          {choice && !committed ? (
            <StakeControl value={stake} onChange={setStake} disabled={committed !== null} />
          ) : null}

          {outOfChips ? (
            <p className="mt-4 text-center text-[13px] text-cream/70">
              You are out of chips. Cases still count.
            </p>
          ) : null}

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
                play("investigate");
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
              <h3 id="warn-title" className="flex items-center gap-2 font-serif text-[19px] font-semibold">
                <TriangleAlert size={20} strokeWidth={2} aria-hidden className="text-red" />
                Lock this verdict?
              </h3>
              <p id="warn-body" className="mt-2 text-[16px] leading-relaxed text-ink/80">
                {game.pinnedArtifacts.length === 0
                  ? "You opened evidence but pinned none. A correct guess can score verdict points, but only pinned evidence is scored."
                  : `${game.pinnedArtifacts.length} of 3 evidence slots are pinned. This decision cannot be changed.`}
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <button
                  ref={warningRef}
                  type="button"
                  onClick={confirmVerdict}
                  className="inline-flex min-h-[44px] items-center rounded-[12px] bg-ink px-5 font-sans text-[16px] font-semibold text-cream"
                >
                  Lock verdict
                </button>
                <button
                  type="button"
                  onClick={() => {
                    play("investigate");
                    setWarning(false);
                  }}
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
            isPinned={game.session.pinnedArtifactIds.includes(activeArtifact.id)}
            canPin={game.canPin(activeArtifact.id)}
            onPin={() => game.pin(activeArtifact.id)}
            onUnpin={() => game.unpin(activeArtifact.id)}
            onClose={closeArtifact}
            onAnnounce={setAnnounce}
            callControls={
              <CompactCallControls
                characterName={gameCase.caller?.characterName ?? "Caller"}
                voice={voice}
              />
            }
          />
        ) : null}
      </AnimatePresence>
    </LayoutGroup>
  );
}
