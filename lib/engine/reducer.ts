import type { CaseFile } from "@/lib/cases/schema";
import type {
  EngineRejection,
  GameEvent,
  GameSession,
  TransitionResult,
} from "@/lib/engine/types";

export function createInitialSession(caseFile: CaseFile, at: string): GameSession {
  return {
    caseId: caseFile.id,
    mode: null,
    revealedArtifactIds: [...caseFile.startingArtifactIds],
    actionIds: [],
    pinnedArtifactIds: [],
    pressureTactics: [],
    timestamps: { startedAt: at },
  };
}

function reject(session: GameSession, reason: EngineRejection): TransitionResult {
  return { accepted: false, session, reason };
}

function accept(session: GameSession): TransitionResult {
  return { accepted: true, session };
}

export function transitionSession(
  caseFile: CaseFile,
  session: GameSession,
  event: GameEvent,
): TransitionResult {
  if (event.type === "START_CASE") {
    return event.caseId === caseFile.id
      ? accept(createInitialSession(caseFile, event.at))
      : reject(session, "CASE_MISMATCH");
  }

  if (event.type === "RESET_CASE") {
    return accept(createInitialSession(caseFile, event.at));
  }

  if (session.caseId !== caseFile.id) {
    return reject(session, "CASE_MISMATCH");
  }

  if (session.verdict !== undefined) {
    return reject(
      session,
      event.type === "COMMIT_VERDICT"
        ? "VERDICT_ALREADY_COMMITTED"
        : "SESSION_COMMITTED",
    );
  }

  if (event.type === "SELECT_MODE") {
    const isLiveFallback =
      session.mode === "live_voice" &&
      (event.mode === "text_fallback" || event.mode === "recorded_fallback");
    if (session.mode !== null && !isLiveFallback) {
      return reject(session, "MODE_ALREADY_SELECTED");
    }
    return accept({
      ...session,
      mode: event.mode,
      timestamps: { ...session.timestamps, modeSelectedAt: event.at },
    });
  }

  if (event.type === "TAKE_ACTION") {
    const action = caseFile.actions.find((candidate) => candidate.id === event.actionId);
    if (!action) {
      return reject(session, "UNKNOWN_ACTION");
    }
    if (action.unlockedBy && !session.actionIds.includes(action.unlockedBy)) {
      return reject(session, "ACTION_LOCKED");
    }
    if (session.actionIds.includes(action.id)) {
      return reject(session, "ACTION_ALREADY_TAKEN");
    }
    return accept({
      ...session,
      actionIds: [...session.actionIds, action.id],
      revealedArtifactIds: [
        ...session.revealedArtifactIds,
        ...action.reveals.filter((id) => !session.revealedArtifactIds.includes(id)),
      ],
    });
  }

  if (event.type === "REVEAL_ARTIFACT") {
    const artifact = caseFile.artifacts.find(
      (candidate) => candidate.id === event.artifactId,
    );
    if (!artifact) {
      return reject(session, "UNKNOWN_ARTIFACT");
    }
    if (artifact.unlockedBy && !session.actionIds.includes(artifact.unlockedBy)) {
      return reject(session, "ARTIFACT_LOCKED");
    }
    if (session.revealedArtifactIds.includes(event.artifactId)) {
      return accept(session);
    }
    return accept({
      ...session,
      revealedArtifactIds: [...session.revealedArtifactIds, event.artifactId],
    });
  }

  if (event.type === "PIN_EVIDENCE") {
    if (!caseFile.artifacts.some((artifact) => artifact.id === event.artifactId)) {
      return reject(session, "UNKNOWN_ARTIFACT");
    }
    if (!session.revealedArtifactIds.includes(event.artifactId)) {
      return reject(session, "ARTIFACT_NOT_REVEALED");
    }
    if (session.pinnedArtifactIds.includes(event.artifactId)) {
      return reject(session, "EVIDENCE_ALREADY_PINNED");
    }
    if (session.pinnedArtifactIds.length >= 3) {
      return reject(session, "PIN_LIMIT_REACHED");
    }
    return accept({
      ...session,
      pinnedArtifactIds: [...session.pinnedArtifactIds, event.artifactId],
    });
  }

  if (event.type === "UNPIN_EVIDENCE") {
    if (!session.pinnedArtifactIds.includes(event.artifactId)) {
      return reject(session, "EVIDENCE_NOT_PINNED");
    }
    return accept({
      ...session,
      pinnedArtifactIds: session.pinnedArtifactIds.filter((id) => id !== event.artifactId),
    });
  }

  if (event.type === "DEAL_PRESSURE_CARD") {
    if (!caseFile.allowedPressureTactics.includes(event.tactic)) {
      return reject(session, "TACTIC_NOT_ALLOWED");
    }
    if (session.pressureTactics.includes(event.tactic)) {
      return reject(session, "TACTIC_ALREADY_DEALT");
    }
    if (session.pressureTactics.length >= 3) {
      return reject(session, "PRESSURE_LIMIT_REACHED");
    }
    return accept({
      ...session,
      pressureTactics: [...session.pressureTactics, event.tactic],
    });
  }

  return accept({
    ...session,
    verdict: event.verdict,
    timestamps: { ...session.timestamps, committedAt: event.at },
  });
}

export function reduceSession(
  caseFile: CaseFile,
  session: GameSession,
  event: GameEvent,
): GameSession {
  return transitionSession(caseFile, session, event).session;
}
