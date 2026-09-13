"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, RotateCcw, Type } from "lucide-react";
import type { CallContent } from "@/lib/cases";

type CallState =
  | "idle"
  | "connecting"
  | "live"
  | "ended"
  | "denied"
  | "unavailable";

const BAR_COUNT = 24;
/** How long each scripted caller turn holds the line. */
const TURN_MS = 3200;

type CallArtifactProps = {
  content: CallContent;
  /** The backup runs the same script with no microphone at all. */
  onAnnounce: (message: string) => void;
  onLiveChange: (live: boolean) => void;
};

export function CallArtifact({
  content,
  onAnnounce,
  onLiveChange,
}: CallArtifactProps) {
  const [state, setState] = useState<CallState>("idle");
  const [textMode, setTextMode] = useState(false);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [turn, setTurn] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const [hasSignal, setHasSignal] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  /** Release every audio resource. Called on hang up and on unmount. */
  const teardown = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      void ctxRef.current.close();
    }
    ctxRef.current = null;
    barsRef.current.forEach((bar) => {
      if (bar) {
        bar.style.height = "3px";
      }
    });
    setHasSignal(false);
  }, []);

  // The microphone must never outlive this panel.
  useEffect(() => teardown, [teardown]);

  useEffect(() => {
    onLiveChange(state === "live");
  }, [state, onLiveChange]);

  // Elapsed time.
  useEffect(() => {
    if (state !== "live") {
      return;
    }
    const timer = window.setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  // Scripted caller turns.
  useEffect(() => {
    if (state !== "live") {
      return;
    }
    if (turn >= content.script.length - 1) {
      setSpeaking(false);
      return;
    }
    const next = turn + 1;
    const timer = window.setTimeout(
      () => {
        setTurn(next);
        setSpeaking(content.script[next].speaker === "caller");
      },
      next === 0 ? 600 : TURN_MS,
    );
    return () => window.clearTimeout(timer);
  }, [state, turn, content.script]);

  const startVoice = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      return;
    }

    setState("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (Ctor) {
        const ctx = new Ctor();
        ctxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const draw = () => {
          analyser.getByteTimeDomainData(data);
          let peak = 0;
          for (let i = 0; i < data.length; i += 1) {
            peak = Math.max(peak, Math.abs(data[i] - 128) / 128);
          }
          setHasSignal(peak > 0.04);
          for (let i = 0; i < BAR_COUNT; i += 1) {
            const bar = barsRef.current[i];
            if (!bar) continue;
            const sample = Math.abs(data[(i * 3) % data.length] - 128) / 128;
            bar.style.height = `${Math.max(3, Math.round(sample * 52))}px`;
          }
          rafRef.current = requestAnimationFrame(draw);
        };
        rafRef.current = requestAnimationFrame(draw);
      }

      setState("live");
      setSeconds(0);
      setTurn(-1);
      onAnnounce(`Call connected with ${content.contactName}.`);
    } catch (error) {
      teardown();
      const denied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "SecurityError");
      setState(denied ? "denied" : "unavailable");
      onAnnounce(
        denied
          ? "Microphone access was denied."
          : "The microphone could not be started.",
      );
    }
  }, [content.contactName, onAnnounce, teardown]);

  const startText = useCallback(() => {
    setTextMode(true);
    setState("live");
    setSeconds(0);
    setTurn(-1);
    onAnnounce(`Text call started with ${content.contactName}.`);
  }, [content.contactName, onAnnounce]);

  const hangUp = useCallback(() => {
    teardown();
    setState("ended");
    setSpeaking(false);
    onAnnounce("Call ended.");
  }, [teardown, onAnnounce]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
  }, [muted]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");

  const statusLabel =
    state === "connecting"
      ? "Connecting"
      : state === "ended"
        ? "Ended"
        : state !== "live"
          ? "Not connected"
          : speaking
            ? "Speaking"
            : textMode
              ? "Connected"
              : hasSignal && !muted
                ? "Listening"
                : "Connected";

  const transcript = content.script.slice(0, turn + 1);

  return (
    <div className="artifact flex min-h-[420px] flex-col bg-[#f7f7f8] px-5 py-6 text-[#1d1d1f]">
      <div className="text-center">
        <p className="text-[24px] font-semibold">{content.contactName}</p>
        <p className="mt-1 text-[14px] text-[#6e6e73]">{content.number}</p>

        <p className="mt-3 flex items-center justify-center gap-2 text-[15px] text-[#3a3a3c]">
          <span
            aria-hidden
            className={`size-2 rounded-full ${
              state === "live"
                ? "call-pulse bg-[#34c759]"
                : state === "connecting"
                  ? "call-pulse bg-[#ff9f0a]"
                  : state === "ended"
                    ? "bg-[#8e8e93]"
                    : "bg-[#c7c7cc]"
            }`}
          />
          <span>{statusLabel}</span>
          {state === "live" || state === "ended" ? (
            <span aria-live="off" className="tabular-nums text-[#6e6e73]">
              {minutes}:{remainder}
            </span>
          ) : null}
        </p>
      </div>

      {/* Bars move only while real microphone audio is arriving. */}
      <div
        className="mt-6 flex h-[56px] items-end justify-center gap-[3px]"
        aria-hidden
      >
        {Array.from({ length: BAR_COUNT }, (_, index) => (
          <span
            key={index}
            ref={(node) => {
              barsRef.current[index] = node;
            }}
            className="w-[3px] rounded-sm bg-[#c7c7cc]"
            style={{ height: 3 }}
          />
        ))}
      </div>
      {state === "live" && textMode ? (
        <p className="mt-2 text-center text-[13px] text-[#6e6e73]">
          Backup call. The microphone is off.
        </p>
      ) : null}

      {state === "idle" ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-end gap-4">
          <p className="max-w-[42ch] text-center text-[14px] leading-relaxed text-[#3a3a3c]">
            Simulated call. The caller is a scripted fictional character, not a
            live AI. If you allow the microphone it is used only to show that you
            are speaking, and the audio stays on this device.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={startVoice}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#34c759] px-6 text-[15px] font-medium text-white"
            >
              <Phone size={18} strokeWidth={2} aria-hidden />
              Start the call
            </button>
          </div>
        </div>
      ) : null}

      {state === "denied" || state === "unavailable" ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-end gap-4">
          <p className="max-w-[42ch] text-center text-[14px] leading-relaxed text-[#3a3a3c]">
            {state === "denied"
              ? "The browser blocked microphone access. You can allow it in the address bar and try again, or continue with the backup call."
              : "No microphone is available in this browser. You can continue with the backup call."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {state === "denied" ? (
              <button
                type="button"
                onClick={startVoice}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-[15px] font-medium text-white"
              >
                <RotateCcw size={18} strokeWidth={2} aria-hidden />
                Try the microphone again
              </button>
            ) : null}
            <button
              type="button"
              onClick={startText}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#c7c7cc] bg-white px-5 text-[15px] text-[#1d1d1f]"
            >
              <Type size={18} strokeWidth={2} aria-hidden />
              Continue with backup
            </button>
          </div>
        </div>
      ) : null}

      {state === "live" || state === "ended" ? (
        <>
          <div className="mt-5 min-h-0 flex-1">
            <h4 className="mb-2 text-[13px] font-semibold tracking-wide text-[#6e6e73] uppercase">
              Transcript
            </h4>
            <ol
              className="max-h-[180px] space-y-2 overflow-auto pr-1"
              aria-live="polite"
            >
              {transcript.map((line, index) => (
                <li key={index} className="text-[15px] leading-snug">
                  <span className="font-semibold">
                    {line.speaker === "caller" ? content.contactName : "You"}:
                  </span>{" "}
                  <span className="text-[#3a3a3c]">{line.text}</span>
                </li>
              ))}
              {transcript.length === 0 ? (
                <li className="text-[15px] text-[#6e6e73]">
                  Waiting for the caller.
                </li>
              ) : null}
            </ol>
          </div>

          {state === "live" ? (
            <div className="mt-5 flex items-center justify-center gap-6">
              {!textMode ? (
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-pressed={muted}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className="flex size-[56px] items-center justify-center rounded-full bg-[#e5e5ea] text-[#1d1d1f]">
                    {muted ? (
                      <MicOff size={22} strokeWidth={2} aria-hidden />
                    ) : (
                      <Mic size={22} strokeWidth={2} aria-hidden />
                    )}
                  </span>
                  <span className="text-[13px] text-[#3a3a3c]">
                    {muted ? "Unmute" : "Mute"}
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={hangUp}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className="flex size-[56px] items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: "#ff3b30" }}
                >
                  <PhoneOff size={22} strokeWidth={2} aria-hidden />
                </span>
                <span className="text-[13px] text-[#3a3a3c]">Hang up</span>
              </button>
            </div>
          ) : (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setTextMode(false);
                  setState("idle");
                  setTurn(-1);
                  setSeconds(0);
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#c7c7cc] bg-white px-5 text-[15px] text-[#1d1d1f]"
              >
                <RotateCcw size={18} strokeWidth={2} aria-hidden />
                Call again
              </button>
            </div>
          )}
        </>
      ) : null}

      {state === "connecting" ? (
        <p className="mt-6 flex-1 text-center text-[15px] text-[#6e6e73]">
          Waiting for microphone permission.
        </p>
      ) : null}
    </div>
  );
}
