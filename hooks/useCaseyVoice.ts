"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import type { PressureTactic } from "@/lib/cases/schema";
import type { GameMode } from "@/lib/engine/types";
import { play } from "@/lib/sound";
import { getFallbackBeats } from "@/lib/voice/fallback";
import { parsePressureToolPayload } from "@/lib/voice/pressure-tactics";
import type { VoiceSessionSuccess } from "@/lib/voice/types";

export type CaseyVoicePhase =
  | "consent"
  | "requesting_microphone"
  | "requesting_token"
  | "connecting"
  | "listening"
  | "speaking"
  | "ended"
  | "error"
  | "text_fallback";

type Caption = { role: "user" | "agent" | "casey"; text: string };

type UseCaseyVoiceOptions = {
  caseId: string;
  maxCallSeconds: number;
  selectMode: (mode: GameMode) => void;
  dealPressureCard: (tactic: PressureTactic) => boolean;
};

function isVoiceSessionSuccess(value: unknown): value is VoiceSessionSuccess {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const body = value as Record<string, unknown>;
  if (
    typeof body.conversationToken !== "string" ||
    typeof body.conversationId !== "string" ||
    typeof body.dynamicVariables !== "object" ||
    body.dynamicVariables === null ||
    Array.isArray(body.dynamicVariables)
  ) {
    return false;
  }
  return Object.values(body.dynamicVariables).every((entry) => typeof entry === "string");
}

export function useCaseyVoice({
  caseId,
  maxCallSeconds,
  selectMode,
  dealPressureCard,
}: UseCaseyVoiceOptions) {
  const [phase, setPhase] = useState<CaseyVoicePhase>("consent");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [fallbackIndex, setFallbackIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [endedByTimer, setEndedByTimer] = useState(false);
  const endedIntentionally = useRef(false);
  const limitStarted = useRef(false);
  const connectedTimer = useRef<number | null>(null);
  const tickTimer = useRef<number | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const startAttempt = useRef(0);
  const endSessionRef = useRef<() => void>(() => undefined);
  const fallbackBeats = getFallbackBeats(caseId);

  const clearTimers = useCallback(() => {
    if (connectedTimer.current) {
      clearTimeout(connectedTimer.current);
      connectedTimer.current = null;
    }
    if (tickTimer.current) {
      clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
  }, []);

  const startHardLimit = useCallback(() => {
    if (limitStarted.current) {
      return;
    }
    limitStarted.current = true;
    setElapsedSeconds(0);
    setEndedByTimer(false);
    const startedAt = Date.now();
    tickTimer.current = window.setInterval(() => {
      setElapsedSeconds(Math.min(maxCallSeconds, Math.floor((Date.now() - startedAt) / 1000)));
    }, 250);
    connectedTimer.current = window.setTimeout(() => {
      endedIntentionally.current = true;
      setEndedByTimer(true);
      setElapsedSeconds(maxCallSeconds);
      if (tickTimer.current) {
        clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
      connectedTimer.current = null;
      endSessionRef.current();
      setPhase("ended");
      play("hangup");
    }, maxCallSeconds * 1000);
  }, [maxCallSeconds]);

  const enterFallback = useCallback(
    (message?: string) => {
      setErrorMessage(message ?? null);
      setPhase("text_fallback");
      selectMode("text_fallback");
      startHardLimit();
      setFallbackIndex((current) => {
        if (current >= 0 || fallbackBeats.length === 0) {
          return current;
        }
        const first = fallbackBeats[0];
        setCaptions([{ role: first.speaker === "caller" ? "agent" : "casey", text: first.text }]);
        if (first.tactic) {
          dealPressureCard(first.tactic);
        }
        return 0;
      });
    },
    [dealPressureCard, fallbackBeats, selectMode, startHardLimit],
  );

  const conversation = useConversation({
    onConnect: () => {
      setPhase("listening");
      startHardLimit();
    },
    onDisconnect: (details) => {
      if (endedIntentionally.current || details.reason === "user" || details.reason === "agent") {
        clearTimers();
        setPhase("ended");
      } else {
        enterFallback("The live call disconnected. Your investigation was preserved.");
      }
    },
    onError: () => {
      setPhase("error");
      enterFallback("Live call unavailable. Continue with the text call.");
    },
    onUnhandledClientToolCall: () => {
      enterFallback("The live caller sent an unsupported action. Continue with the text call.");
    },
    onModeChange: ({ mode }) => setPhase(mode),
    onMessage: ({ message, role }) => {
      if (typeof message !== "string" || (role !== "user" && role !== "agent")) {
        return;
      }
      setCaptions((current) => [...current.slice(-19), { role, text: message }]);
    },
    clientTools: {
      dealPressureCard: (payload: unknown) => {
        const parsed = parsePressureToolPayload(payload);
        if (!parsed.success) {
          return "Pressure card rejected";
        }
        return dealPressureCard(parsed.tactic)
          ? "Pressure card dealt"
          : "Pressure card rejected";
      },
    },
  });
  endSessionRef.current = () => {
    void conversation.endSession();
  };
  const { endSession, isMuted, setMuted, startSession } = conversation;

  const end = useCallback(() => {
    startAttempt.current += 1;
    requestController.current?.abort();
    requestController.current = null;
    endedIntentionally.current = true;
    clearTimers();
    void endSession();
    setPhase("ended");
  }, [clearTimers, endSession]);

  const startLive = useCallback(async () => {
    if (phase !== "consent") {
      return;
    }
    selectMode("live_voice");
    const attempt = startAttempt.current + 1;
    startAttempt.current = attempt;
    endedIntentionally.current = false;
    setErrorMessage(null);
    setPhase("requesting_microphone");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      if (attempt !== startAttempt.current) {
        return;
      }
      enterFallback("Microphone permission was not granted. Continue with the text call.");
      return;
    }

    if (attempt !== startAttempt.current) {
      return;
    }

    setPhase("requesting_token");
    try {
      const controller = new AbortController();
      requestController.current = controller;
      const timer = window.setTimeout(() => controller.abort(), 8_000);
      try {
        const response = await fetch("/api/voice-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ caseId }),
          cache: "no-store",
          signal: controller.signal,
        });
        const body: unknown = await response.json();
        if (attempt !== startAttempt.current) {
          return;
        }
        if (!response.ok || !isVoiceSessionSuccess(body)) {
          enterFallback("Live call authorization failed. Continue with the text call.");
          return;
        }
        setPhase("connecting");
        await startSession({
          conversationToken: body.conversationToken,
          connectionType: "webrtc",
          dynamicVariables: body.dynamicVariables,
        });
      } finally {
        window.clearTimeout(timer);
        if (requestController.current === controller) {
          requestController.current = null;
        }
      }
    } catch {
      if (attempt !== startAttempt.current) {
        return;
      }
      enterFallback("The network could not start the live call. Continue with the text call.");
    }
  }, [caseId, enterFallback, phase, selectMode, startSession]);

  const chooseFallback = useCallback(() => {
    if (phase !== "consent") {
      return;
    }
    enterFallback();
  }, [enterFallback, phase]);

  const advanceFallback = useCallback(() => {
    setFallbackIndex((current) => {
      const next = current + 1;
      const beat = fallbackBeats[next];
      if (!beat) {
        setPhase("ended");
        return current;
      }
      setCaptions((entries) => [
        ...entries,
        { role: beat.speaker === "caller" ? "agent" : "casey", text: beat.text },
      ]);
      if (beat.tactic) {
        dealPressureCard(beat.tactic);
      }
      return next;
    });
  }, [dealPressureCard, fallbackBeats]);

  const reset = useCallback(() => {
    startAttempt.current += 1;
    requestController.current?.abort();
    requestController.current = null;
    endedIntentionally.current = true;
    limitStarted.current = false;
    void endSession();
    clearTimers();
    setPhase("consent");
    setCaptions([]);
    setFallbackIndex(-1);
    setErrorMessage(null);
    setElapsedSeconds(0);
    setEndedByTimer(false);
  }, [clearTimers, endSession]);

  useEffect(
    () => () => {
      startAttempt.current += 1;
      requestController.current?.abort();
      requestController.current = null;
      endedIntentionally.current = true;
      clearTimers();
      void endSession();
    },
    [caseId, clearTimers, endSession],
  );

  return {
    phase,
    captions,
    errorMessage,
    elapsedSeconds,
    remainingSeconds: Math.max(0, maxCallSeconds - elapsedSeconds),
    maxCallSeconds,
    endedByTimer,
    isMuted,
    setMuted,
    startLive,
    chooseFallback,
    advanceFallback,
    hasNextFallbackBeat: fallbackIndex + 1 < fallbackBeats.length,
    end,
    reset,
  };
}
