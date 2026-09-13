"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Info, MessageSquareText, Phone, type LucideIcon } from "lucide-react";
import { MirroredCorner } from "@/components/ArtifactCard";
import type { useCaseyVoice } from "@/hooks/useCaseyVoice";

type VoiceController = ReturnType<typeof useCaseyVoice>;

type CallPanelProps = {
  characterName: string;
  organizationName: string;
  playerName: string;
  voice: VoiceController;
};

const CALL_IN_PROGRESS = new Set<VoiceController["phase"]>([
  "requesting_microphone",
  "requesting_token",
  "connecting",
  "listening",
  "speaking",
  "text_fallback",
]);

function formatClock(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function CourtIndex({
  letter,
  icon: Icon,
  iconClass,
}: {
  letter: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <div className="flex w-5 flex-col items-center gap-0.5" aria-hidden>
      <span className="font-serif text-[15px] leading-none text-ink">{letter}</span>
      <Icon size={14} strokeWidth={1.75} className={iconClass} />
    </div>
  );
}

function PlayCard({
  label,
  index,
  icon,
  iconClass,
  children,
}: {
  label: string;
  index: string;
  icon: LucideIcon;
  iconClass: string;
  children: ReactNode;
}) {
  return (
    <article
      aria-label={label}
      className="surface-cream relative aspect-[3/4] w-full overflow-hidden rounded-[12px] bg-cream shadow-[0_2px_8px_rgba(37,33,33,0.22)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[6px] rounded-[6px] border-[1.5px] border-gold"
      />
      <div className="pointer-events-none absolute inset-[14px]" aria-hidden>
        <div className="absolute top-0 left-0">
          <CourtIndex letter={index} icon={icon} iconClass={iconClass} />
        </div>
        <MirroredCorner>
          <CourtIndex letter={index} icon={icon} iconClass={iconClass} />
        </MirroredCorner>
      </div>
      {children}
    </article>
  );
}

function CallerFigure({ initial }: { initial: string }) {
  return (
    <span className="flex size-[44px] items-center justify-center rounded-full bg-felt">
      <span className="font-serif text-[18px] leading-none text-cream">{initial}</span>
    </span>
  );
}

export function CompactCallControls({
  characterName,
  voice,
}: Pick<CallPanelProps, "characterName" | "voice">) {
  if (!CALL_IN_PROGRESS.has(voice.phase)) {
    return null;
  }

  return (
    <div className="mb-3 flex min-h-[44px] items-center justify-between gap-3 rounded-[10px] border border-cream/30 bg-felt-deep px-3 py-2 text-cream">
      <p className="min-w-0 truncate text-[14px]">
        <span className="font-semibold">In call with {characterName}</span>
        <span className="ml-2 font-serif tabular-nums text-cream/70">
          {formatClock(voice.remainingSeconds)} left
        </span>
      </p>
      <button
        type="button"
        onClick={voice.end}
        className="inline-flex h-[34px] shrink-0 items-center rounded-full bg-red px-3 font-sans text-[13px] font-semibold text-cream"
        aria-label="End the call"
      >
        End call
      </button>
    </div>
  );
}

function MicDisclosure() {
  const [open, setOpen] = useState(false);
  const popoverId = useId();

  return (
    <div className="relative mt-2 flex items-start justify-center gap-1.5">
      <p className="max-w-[19rem] text-center font-sans text-[12px] leading-snug text-cream/55 min-[720px]:whitespace-nowrap">
        Answering uses your microphone. Nothing is recorded.
      </p>
      <button
        type="button"
        className="mt-px inline-flex size-[14px] items-center justify-center text-cream/55"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={open ? "Hide microphone details" : "Show microphone details"}
        onClick={() => setOpen((current) => !current)}
      >
        <Info size={14} strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <p
          id={popoverId}
          role="note"
          className="surface-cream absolute top-full left-1/2 z-10 mt-2 w-[min(260px,calc(100vw-2.5rem))] -translate-x-1/2 rounded-[8px] border border-gold bg-cream p-3 text-left font-sans text-[12px] leading-relaxed text-ink shadow-[0_2px_8px_rgba(37,33,33,0.22)]"
        >
          Answering sends microphone audio to ElevenLabs so the caller can respond.
          Casey does not store audio or transcripts. Do not share personal information.
        </p>
      ) : null}
    </div>
  );
}

export function CallPanel({
  characterName,
  organizationName,
  playerName,
  voice,
}: CallPanelProps) {
  const incoming = voice.phase === "consent";
  const live = CALL_IN_PROGRESS.has(voice.phase);
  const connected = voice.phase === "listening" || voice.phase === "speaking";
  const initial = characterName.charAt(0);
  const listEnd = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: "end" });
  }, [voice.captions.length]);

  return (
    <section className="mt-8 flex justify-center" aria-label="Caller and transcript">
      <div className="flex w-full max-w-[660px] flex-col items-center gap-5 min-[720px]:flex-row min-[720px]:items-start min-[720px]:justify-center">
        <div className="flex w-full max-w-[320px] flex-col">
          <PlayCard
            label={`Call with ${characterName}`}
            index="M"
            icon={Phone}
            iconClass="text-red"
          >
            <div
              aria-hidden
              className="absolute inset-x-[22px] top-1/2 h-px bg-gold/50"
            />

            <div className="absolute inset-x-8 top-[18%] flex flex-col items-center text-center">
              <CallerFigure initial={initial} />
              <p className="mt-2 font-serif text-[15px] leading-tight text-ink">
                {characterName}
              </p>
              <p className="mt-1 font-sans text-[12px] leading-snug text-ink/60">
                {organizationName}
              </p>
              <div className="mt-2" role="status">
                {incoming ? (
                  <p className="flex items-center justify-center gap-1.5 font-label text-[11px] font-medium tracking-[0.07em] text-red">
                    <span className="call-pulse size-[6px] rounded-full bg-red" aria-hidden />
                    Incoming
                  </p>
                ) : (
                  <p className="font-serif text-[17px] leading-none text-ink tabular-nums">
                    {formatClock(voice.elapsedSeconds)}
                  </p>
                )}
              </div>
            </div>

            {connected ? (
              <div
                className="court-bars absolute top-1/2 left-1/2 flex h-8 -translate-x-1/2 -translate-y-1/2 items-center gap-[3px]"
                aria-hidden
              >
                {Array.from({ length: 9 }, (_, index) => (
                  <span
                    key={index}
                    className="court-bar w-[3px] rounded-full bg-felt/70"
                    style={{ animationDelay: `${index * -80}ms` }}
                  />
                ))}
              </div>
            ) : null}

            <div
              className="absolute inset-x-8 bottom-[16%] flex justify-center opacity-[0.16]"
              aria-hidden
            >
              <div style={{ transform: "rotate(180deg)" }}>
                <CallerFigure initial={initial} />
              </div>
            </div>
          </PlayCard>

          {incoming ? (
            <>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={voice.startLive}
                  className="inline-flex h-[34px] flex-1 items-center justify-center gap-1.5 rounded-full bg-red font-sans text-[13px] font-semibold text-cream"
                >
                  <Phone size={14} strokeWidth={1.75} aria-hidden />
                  Answer
                </button>
                <button
                  type="button"
                  onClick={voice.chooseFallback}
                  className="inline-flex h-[34px] flex-1 items-center justify-center rounded-full border border-cream/45 font-sans text-[13px] font-semibold text-cream"
                >
                  Decline
                </button>
              </div>
              <MicDisclosure />
              <p className="mt-1.5 text-center font-sans text-[11px] text-cream/45">
                The line closes at 75 seconds.
              </p>
            </>
          ) : null}

          {live ? (
            <>
              <button
                type="button"
                onClick={voice.end}
                className="mt-3 inline-flex h-[34px] w-full items-center justify-center rounded-full bg-red font-sans text-[13px] font-semibold text-cream"
              >
                End call
              </button>
              <p className="mt-1.5 text-center font-sans text-[11px] text-cream/45">
                The line closes at 75 seconds.
              </p>
            </>
          ) : null}
        </div>

        <div className="flex w-full max-w-[320px] flex-col">
          <PlayCard
            label={voice.phase === "ended" ? "Call transcript" : "Live transcript"}
            index="T"
            icon={MessageSquareText}
            iconClass="text-ink"
          >
            <div className="absolute inset-[22px] flex flex-col pt-6">
              <h2 className="shrink-0 text-center font-label text-[11px] font-medium tracking-[0.08em] text-ink/70 uppercase">
                {voice.phase === "ended" ? "Call transcript" : "Live transcript"}
              </h2>
              <ol
                className="transcript-page mt-2 min-h-0 flex-1 overflow-y-auto"
                aria-label="Call transcript"
                aria-live="polite"
              >
                {voice.captions.length === 0 ? (
                  <li className="font-sans text-[13px] leading-6 text-ink/45 italic">
                    Captions appear here once the line opens.
                  </li>
                ) : (
                  voice.captions.map((caption, index) => (
                    <li
                      key={`${caption.role}-${index}-${caption.text}`}
                      className="font-sans text-[13px] leading-6 text-ink"
                    >
                      <span className="font-semibold">
                        {caption.role === "user"
                          ? playerName
                          : caption.role === "casey"
                            ? "Casey"
                            : characterName}
                        :
                      </span>{" "}
                      {caption.text}
                    </li>
                  ))
                )}
                <li ref={listEnd} className="h-0 overflow-hidden" aria-hidden />
              </ol>
            </div>
          </PlayCard>

          {voice.phase === "text_fallback" && voice.hasNextFallbackBeat ? (
            <button
              type="button"
              onClick={voice.advanceFallback}
              className="mt-3 inline-flex h-[34px] w-full items-center justify-center rounded-full border border-cream/45 font-sans text-[13px] font-semibold text-cream"
            >
              Continue conversation
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
