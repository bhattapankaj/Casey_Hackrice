"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import type { PressureTactic } from "@/lib/cases/schema";
import type { GameMode } from "@/lib/engine/types";
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
  const endedIntentionally = useRef(false);
  const connectedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endSessionRef = useRef<() => void>(() => undefined);
  const fallbackBeats = getFallbackBeats(caseId);

  const enterFallback = useCallback(
    (message?: string) => {
      setErrorMessage(message ?? null);
      setPhase("text_fallback");
      selectMode("text_fallback");
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
    [dealPressureCard, fallbackBeats, selectMode],
  );

  const conversation = useConversation({
    onConnect: () => {
      setPhase("listening");
      connectedTimer.current = setTimeout(() => {
        endedIntentionally.current = true;
        endSessionRef.current();
        setPhase("ended");
      }, maxCallSeconds * 1000);
    },
    onDisconnect: (details) => {
      if (connectedTimer.current) {
        clearTimeout(connectedTimer.current);
        connectedTimer.current = null;
      }
      if (endedIntentionally.current || details.reason === "user" || details.reason === "agent") {
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
      setCaptions((current) => [...current.slice(-7), { role, text: message }]);
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
    endedIntentionally.current = true;
    if (connectedTimer.current) {
      clearTimeout(connectedTimer.current);
      connectedTimer.current = null;
    }
    void endSession();
    setPhase("ended");
  }, [endSession]);

  const startLive = useCallback(async () => {
    if (phase !== "consent") {
      return;
    }
    selectMode("live_voice");
    endedIntentionally.current = false;
    setErrorMessage(null);
    setPhase("requesting_microphone");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      enterFallback("Microphone permission was not granted. Continue with the text call.");
      return;
    }

    setPhase("requesting_token");
    try {
      const controller = new AbortController();
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
      }
    } catch {
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
    endedIntentionally.current = true;
    void endSession();
    if (connectedTimer.current) {
      clearTimeout(connectedTimer.current);
      connectedTimer.current = null;
    }
    setPhase("consent");
    setCaptions([]);
    setFallbackIndex(-1);
    setErrorMessage(null);
  }, [endSession]);

  useEffect(
    () => () => {
      endedIntentionally.current = true;
      if (connectedTimer.current) {
        clearTimeout(connectedTimer.current);
      }
      void endSession();
    },
    [caseId, endSession],
  );

  return {
    phase,
    captions,
    errorMessage,
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
