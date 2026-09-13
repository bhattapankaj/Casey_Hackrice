"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import type { useCaseyVoice } from "@/hooks/useCaseyVoice";
import type { PressureTactic } from "@/lib/cases/schema";

type VoiceController = ReturnType<typeof useCaseyVoice>;

type CallPanelProps = {
  characterName: string;
  organizationName: string;
  voice: VoiceController;
  pressureTactics: PressureTactic[];
};

const STATUS_LABELS: Record<VoiceController["phase"], string> = {
  consent: "Incoming call",
  requesting_microphone: "Waiting for microphone",
  requesting_token: "Connecting",
  connecting: "Connecting",
  listening: "Listening",
  speaking: "Speaking",
  ended: "Call ended",
  error: "Call unavailable",
  text_fallback: "Text call active",
};

const CALL_IN_PROGRESS = new Set<VoiceController["phase"]>([
  "requesting_microphone",
  "requesting_token",
  "connecting",
  "listening",
  "speaking",
  "text_fallback",
]);
const CONNECTED_VOICE = new Set<VoiceController["phase"]>(["listening", "speaking"]);
const TIMER_RUNNING = new Set<VoiceController["phase"]>([
  "listening",
  "speaking",
  "text_fallback",
]);
const WAVE_HEIGHTS = [9, 17, 28, 14, 34, 22, 43, 29, 18, 38, 24, 13, 31, 20, 10];

function formatDuration(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function PressurePile({ tactics }: { tactics: PressureTactic[] }) {
  return (
    <div className="flex gap-1.5" aria-label={`${tactics.length} pressure cards dealt`}>
      {Array.from({ length: 3 }, (_, index) => (
        <span
          key={index}
          className={`block h-10 w-7 rounded-[4px] border ${
            index < tactics.length
              ? "border-gold bg-cream bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(207,156,45,0.3)_4px,rgba(207,156,45,0.3)_5px)]"
              : "border-ink/15 bg-transparent"
          }`}
          aria-hidden
        />
      ))}
    </div>
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
    <div className="mb-3 flex min-h-[52px] items-center justify-between gap-3 rounded-[10px] bg-ink px-3 py-2 text-cream">
      <div className="flex min-w-0 items-center gap-3">
        <span className="call-pulse size-2 shrink-0 rounded-full bg-[#34c759]" aria-hidden />
        <p className="min-w-0 truncate text-[14px]">
          <span className="font-semibold">In call with {characterName}</span>
          <span className="ml-2 text-cream/65">{STATUS_LABELS[voice.phase]}</span>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {CONNECTED_VOICE.has(voice.phase) ? (
          <button
            type="button"
            onClick={() => voice.setMuted(!voice.isMuted)}
            className="flex size-9 items-center justify-center rounded-full bg-cream/15 text-cream"
            aria-label={voice.isMuted ? "Unmute the call" : "Mute the call"}
            aria-pressed={voice.isMuted}
          >
            {voice.isMuted ? <MicOff size={16} aria-hidden /> : <Mic size={16} aria-hidden />}
          </button>
        ) : null}
        <button
          type="button"
          onClick={voice.end}
          className="flex size-9 items-center justify-center rounded-full bg-red text-white"
          aria-label="End the call"
        >
          <PhoneOff size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function CallPanel({
  characterName,
  organizationName,
  voice,
  pressureTactics,
}: CallPanelProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (voice.phase === "consent") {
      setSeconds(0);
      return;
    }
    if (!TIMER_RUNNING.has(voice.phase)) {
      return;
    }
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1_000);
    return () => window.clearInterval(timer);
  }, [voice.phase]);

  if (voice.phase === "consent") {
    return (
      <section
        className="surface-cream mx-auto mt-8 w-full max-w-[680px] rounded-[16px] bg-[#f7f7f8] px-5 py-6 text-[#1d1d1f] shadow-[0_8px_28px_rgba(20,40,30,0.32)] sm:px-7"
        aria-labelledby="incoming-call-title"
      >
        <div className="text-center">
          <p className="font-label text-[11px] tracking-[0.12em] text-[#6e6e73]">INCOMING CALL</p>
          <div className="relative mx-auto mt-4 flex size-20 items-center justify-center rounded-full bg-[#496355] text-cream">
            <span className="font-serif text-[31px] font-semibold" aria-hidden>
              {characterName.charAt(0)}
            </span>
            <span className="call-pulse absolute -right-0.5 -bottom-0.5 size-4 rounded-full border-[3px] border-[#f7f7f8] bg-[#34c759]" aria-hidden />
          </div>
          <h2 id="incoming-call-title" className="mt-3 font-serif text-[26px] font-semibold">
            {characterName}
          </h2>
          <p className="mt-0.5 text-[14px] text-[#6e6e73]">{organizationName}</p>
        </div>

        <p className="mx-auto mt-5 max-w-[56ch] rounded-[10px] bg-[#ececee] px-4 py-3 text-[13px] leading-relaxed text-[#4b4b4f]">
          <span className="font-semibold text-[#1d1d1f]">Practice call:</span> answering sends
          microphone audio to ElevenLabs so {characterName} can respond. Casey does not store
          audio or transcripts. Do not share personal information.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={voice.startLive}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#34c759] px-6 text-[15px] font-semibold text-white"
          >
            <Phone size={18} aria-hidden />
            Answer with microphone
          </button>
          <button
            type="button"
            onClick={voice.chooseFallback}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[#c7c7cc] bg-white px-5 text-[15px] font-medium"
          >
            <MessageSquareText size={18} aria-hidden />
            Use text instead
          </button>
        </div>
      </section>
    );
  }

  const inProgress = CALL_IN_PROGRESS.has(voice.phase);
  const connectedVoice = CONNECTED_VOICE.has(voice.phase);
  const waveActive = connectedVoice && !voice.isMuted;

  return (
    <section className="surface-cream mx-auto mt-8 w-full max-w-[680px] overflow-hidden rounded-[16px] bg-[#f7f7f8] text-[#1d1d1f] shadow-[0_8px_28px_rgba(20,40,30,0.32)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#dedee2] px-5 py-3">
        <p className="font-label text-[11px] tracking-[0.12em] text-[#6e6e73]">
          {inProgress ? "IN CALL" : "CALL"}
        </p>
        <PressurePile tactics={pressureTactics} />
      </div>

      <div className="px-5 py-5 sm:px-7">
        <div className="text-center">
          <div className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-[#496355] text-cream">
            <span className="font-serif text-[25px] font-semibold" aria-hidden>
              {characterName.charAt(0)}
            </span>
            {inProgress ? (
              <span className="call-pulse absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-[3px] border-[#f7f7f8] bg-[#34c759]" aria-hidden />
            ) : null}
          </div>
          <h2 className="mt-2 font-serif text-[23px] font-semibold">{characterName}</h2>
          <p className="text-[13px] text-[#6e6e73]">{organizationName}</p>
          <p className="mt-2 flex items-center justify-center gap-2 text-[14px] text-[#3a3a3c]" role="status">
            <span className={`size-2 rounded-full ${inProgress ? "bg-[#34c759]" : "bg-[#8e8e93]"}`} aria-hidden />
            {STATUS_LABELS[voice.phase]}
            <span className="tabular-nums text-[#6e6e73]">{formatDuration(seconds)}</span>
          </p>
        </div>

        <div
          className={`voice-bars mx-auto mt-3 flex h-10 items-center justify-center gap-[3px] ${waveActive ? "voice-bars-active" : ""}`}
          aria-hidden
        >
          {WAVE_HEIGHTS.map((height, index) => (
            <span
              key={index}
              className="voice-bar w-[3px] rounded-full bg-[#8e8e93]"
              style={{ height, animationDelay: `${index * -70}ms` }}
            />
          ))}
        </div>

        {inProgress ? (
          <div className="mt-3 flex items-start justify-center gap-7">
            {connectedVoice ? (
              <button
                type="button"
                onClick={() => voice.setMuted(!voice.isMuted)}
                className="flex flex-col items-center gap-1 text-[12px] text-[#3a3a3c]"
                aria-label={voice.isMuted ? "Unmute the call" : "Mute the call"}
                aria-pressed={voice.isMuted}
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-[#e5e5ea]">
                  {voice.isMuted ? <MicOff size={19} aria-hidden /> : <Mic size={19} aria-hidden />}
                </span>
                {voice.isMuted ? "Unmute" : "Mute"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={voice.end}
              className="flex flex-col items-center gap-1 text-[12px] text-[#3a3a3c]"
              aria-label="End the call"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-[#ff3b30] text-white">
                <PhoneOff size={19} aria-hidden />
              </span>
              Hang up
            </button>
          </div>
        ) : null}

        <div className="mt-5 border-t border-[#dedee2] pt-4">
          <p className="font-label text-[11px] tracking-[0.1em] text-[#6e6e73]">
            {voice.phase === "text_fallback" ? "CALL TRANSCRIPT" : "LIVE CAPTIONS"}
          </p>
          {voice.errorMessage ? (
            <p className="mt-2 text-[13px] text-[#6e6e73]">
              Voice connection unavailable. The conversation continued in text.
            </p>
          ) : null}
          <div className="mt-2 max-h-32 space-y-2 overflow-auto" aria-label="Call captions" aria-live="polite">
            {voice.captions.length === 0 ? (
              <p className="text-[14px] text-[#6e6e73]">Waiting for {characterName}...</p>
            ) : (
              voice.captions.map((caption, index) => (
                <p key={`${caption.role}-${index}-${caption.text}`} className="text-[14px] leading-relaxed">
                  <span className="font-semibold">
                    {caption.role === "user" ? "You" : caption.role === "casey" ? "Casey" : characterName}:
                  </span>{" "}
                  <span className="text-[#3a3a3c]">{caption.text}</span>
                </p>
              ))
            )}
          </div>
          {voice.phase === "text_fallback" && voice.hasNextFallbackBeat ? (
            <button
              type="button"
              onClick={voice.advanceFallback}
              className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-[#c7c7cc] bg-white px-4 text-[14px] font-semibold"
            >
              Continue conversation
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
