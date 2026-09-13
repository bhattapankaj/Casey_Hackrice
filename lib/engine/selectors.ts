import type { CaseFile } from "@/lib/cases/schema";
import type { GameSession } from "@/lib/engine/types";

export function selectRevealedArtifacts(caseFile: CaseFile, session: GameSession) {
  return session.revealedArtifactIds.flatMap((id) => {
    const artifact = caseFile.artifacts.find((candidate) => candidate.id === id);
    return artifact ? [artifact] : [];
  });
}

export function selectPinnedArtifacts(caseFile: CaseFile, session: GameSession) {
  return session.pinnedArtifactIds.flatMap((id) => {
    const artifact = caseFile.artifacts.find((candidate) => candidate.id === id);
    return artifact ? [artifact] : [];
  });
}

export function selectAvailableActions(caseFile: CaseFile, session: GameSession) {
  return caseFile.actions.filter(
    (action) =>
      !session.actionIds.includes(action.id) &&
      (action.unlockedBy === undefined || session.actionIds.includes(action.unlockedBy)),
  );
}

export function selectCompletedActions(caseFile: CaseFile, session: GameSession) {
  return session.actionIds.flatMap((id) => {
    const action = caseFile.actions.find((candidate) => candidate.id === id);
    return action ? [action] : [];
  });
}

export function canPinEvidence(session: GameSession, artifactId: string): boolean {
  return (
    session.verdict === undefined &&
    session.revealedArtifactIds.includes(artifactId) &&
    !session.pinnedArtifactIds.includes(artifactId) &&
    session.pinnedArtifactIds.length < 3
  );
}
