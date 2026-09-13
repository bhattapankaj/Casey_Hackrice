"use client";

import { Mic, MicOff, PhoneOff } from "lucide-react";
import type { PressureTactic } from "@/lib/cases/schema";
import type { useCaseyVoice } from "@/hooks/useCaseyVoice";

type VoiceController = ReturnType<typeof useCaseyVoice>;

type CallPanelProps = {
  characterName: string;
  voice: VoiceController;
  pressureTactics: PressureTactic[];
};

const STATUS_LABELS: Record<VoiceController["phase"], string> = {
  consent: "Ready",
  requesting_microphone: "Requesting microphone",
  requesting_token: "Authorizing secure call",
  connecting: "Connecting",
  listening: "Listening",
  speaking: "Speaking",
  ended: "Ended",
  error: "Live call unavailable",
  text_fallback: "Text call",
};

export function CallPanel({ characterName, voice, pressureTactics }: CallPanelProps) {
  if (voice.phase === "consent") {
    return (
      <section className="mt-8 rounded-[12px] border border-cream/15 p-5" aria-labelledby="call-mode-title">
        <h2 id="call-mode-title" className="font-serif text-[24px] font-semibold text-cream">
          Take the fictional call
        </h2>
        <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-cream/85">
          If you use the microphone, your voice is processed by ElevenLabs for this live
          fictional call. Casey does not store raw audio or transcripts. Do not share real
          personal information.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={voice.startLive}
            className="inline-flex items-center gap-2 rounded-[12px] bg-cream px-5 py-3 font-sans text-[15px] font-semibold text-ink"
          >
            <Mic size={19} aria-hidden />
            Use microphone
          </button>
          <button
            type="button"
            onClick={voice.chooseFallback}
            className="rounded-[12px] border border-cream/30 px-5 py-3 font-sans text-[15px] font-semibold text-cream"
          >
            Play without microphone
          </button>
        </div>
      </section>
    );
  }

  const isLive = ["requesting_microphone", "requesting_token", "connecting", "listening", "speaking"].includes(
    voice.phase,
  );

  return (
    <section className="mt-8 grid gap-4 rounded-[12px] border border-cream/15 p-5 md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-[24px] font-semibold text-cream">{characterName}</h2>
          <p className="flex items-center gap-2 text-[13px] text-cream/75" role="status">
            <span
              className={`size-2 rounded-full ${isLive ? "call-pulse bg-[#34c759]" : "bg-cream/40"}`}
              aria-hidden
            />
            {STATUS_LABELS[voice.phase]}
          </p>
        </div>
        {voice.errorMessage ? (
          <p className="mt-2 text-[14px] text-cream/85">{voice.errorMessage}</p>
        ) : null}
        <div className="mt-4 max-h-36 space-y-2 overflow-auto" aria-label="Call captions" aria-live="polite">
          {voice.captions.length === 0 ? (
            <p className="text-[14px] text-cream/60">Captions will appear here.</p>
          ) : (
            voice.captions.map((caption, index) => (
              <p key={`${caption.role}-${index}-${caption.text}`} className="text-[14px] leading-relaxed text-cream/90">
                <span className="font-semibold">
                  {caption.role === "user" ? "You" : caption.role === "casey" ? "Casey" : characterName}:
                </span>{" "}
                {caption.text}
              </p>
            ))
          )}
        </div>
        {voice.phase === "text_fallback" && voice.hasNextFallbackBeat ? (
          <button
            type="button"
            onClick={voice.advanceFallback}
            className="mt-4 font-sans text-[14px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
          >
            Continue text call
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3 md:flex-col md:items-end">
        <div className="flex gap-2" aria-label={`${pressureTactics.length} pressure cards dealt`}>
          {Array.from({ length: 3 }, (_, index) => (
            <span
              key={index}
              className={`block h-12 w-9 rounded-[5px] border ${
                index < pressureTactics.length
                  ? "border-gold bg-cream bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,rgba(207,156,45,0.24)_5px,rgba(207,156,45,0.24)_6px)]"
                  : "border-cream/15 bg-transparent"
              }`}
              aria-hidden
            />
          ))}
        </div>
        {isLive ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => voice.setMuted(!voice.isMuted)}
              className="flex size-11 items-center justify-center rounded-full bg-cream text-ink"
              aria-label={voice.isMuted ? "Unmute the call" : "Mute the call"}
              aria-pressed={voice.isMuted}
            >
              {voice.isMuted ? <MicOff size={18} aria-hidden /> : <Mic size={18} aria-hidden />}
            </button>
            <button
              type="button"
              onClick={voice.end}
              className="flex size-11 items-center justify-center rounded-full bg-red text-white"
              aria-label="End the call"
            >
              <PhoneOff size={18} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
