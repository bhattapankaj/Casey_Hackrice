"use client";

import { useCallback, useMemo, useReducer, useRef } from "react";
import type { CaseFile, PressureTactic, Verdict } from "@/lib/cases/schema";
import { buildReceipt } from "@/lib/engine/receipt";
import {
  createInitialSession,
  reduceSession,
  transitionSession,
} from "@/lib/engine/reducer";
import { scoreSession } from "@/lib/engine/score";
import {
  canPinEvidence,
  selectAvailableActions,
  selectPinnedArtifacts,
  selectRevealedArtifacts,
} from "@/lib/engine/selectors";
import type { GameEvent, GameMode } from "@/lib/engine/types";

function now(): string {
  return new Date().toISOString();
}

export function useGameSession(caseFile: CaseFile) {
  const [session, dispatch] = useReducer(
    (current: ReturnType<typeof createInitialSession>, event: GameEvent) =>
      reduceSession(caseFile, current, event),
    caseFile,
    (initialCase) => createInitialSession(initialCase, now()),
  );
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const revealedArtifacts = useMemo(
    () => selectRevealedArtifacts(caseFile, session),
    [caseFile, session],
  );
  const pinnedArtifacts = useMemo(
    () => selectPinnedArtifacts(caseFile, session),
    [caseFile, session],
  );
  const availableActions = useMemo(
    () => selectAvailableActions(caseFile, session),
    [caseFile, session],
  );
  const score = useMemo(
    () => (session.verdict ? scoreSession(caseFile, session) : null),
    [caseFile, session],
  );
  const receipt = useMemo(
    () => (score ? buildReceipt(caseFile, session, score) : null),
    [caseFile, score, session],
  );

  return {
    session,
    revealedArtifacts,
    pinnedArtifacts,
    availableActions,
    score,
    receipt,
    selectMode: useCallback(
      (mode: GameMode) => dispatch({ type: "SELECT_MODE", mode, at: now() }),
      [],
    ),
    takeAction: useCallback(
      (actionId: string) => dispatch({ type: "TAKE_ACTION", actionId }),
      [],
    ),
    pin: useCallback(
      (artifactId: string) => dispatch({ type: "PIN_EVIDENCE", artifactId }),
      [],
    ),
    unpin: useCallback(
      (artifactId: string) => dispatch({ type: "UNPIN_EVIDENCE", artifactId }),
      [],
    ),
    canPin: useCallback(
      (artifactId: string) => canPinEvidence(session, artifactId),
      [session],
    ),
    dealPressureCard: useCallback(
      (tactic: PressureTactic): boolean => {
        const event = { type: "DEAL_PRESSURE_CARD", tactic } as const;
        const result = transitionSession(caseFile, sessionRef.current, event);
        if (!result.accepted) {
          return false;
        }
        // Keep the ref ahead of React so back-to-back tool calls cannot bypass
        // duplicate or three-card limits before the next render.
        sessionRef.current = result.session;
        dispatch(event);
        return true;
      },
      [caseFile],
    ),
    commitVerdict: useCallback(
      (verdict: Verdict) => dispatch({ type: "COMMIT_VERDICT", verdict, at: now() }),
      [],
    ),
    reset: useCallback(() => dispatch({ type: "RESET_CASE", at: now() }), []),
  };
}
