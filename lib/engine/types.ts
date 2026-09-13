import type {
  Channel,
  PressureTactic,
  SourceClass,
  Verdict,
} from "@/lib/cases/schema";

export type GameMode = "live_voice" | "text_fallback" | "recorded_fallback";

export type GameSession = {
  caseId: string;
  mode: GameMode | null;
  revealedArtifactIds: string[];
  actionIds: string[];
  pinnedArtifactIds: string[];
  pressureTactics: PressureTactic[];
  verdict?: Verdict;
  timestamps: {
    startedAt: string;
    modeSelectedAt?: string;
    committedAt?: string;
  };
};

export type GameEvent =
  | { type: "START_CASE"; caseId: string; at: string }
  | { type: "SELECT_MODE"; mode: GameMode; at: string }
  | { type: "TAKE_ACTION"; actionId: string }
  | { type: "REVEAL_ARTIFACT"; artifactId: string }
  | { type: "PIN_EVIDENCE"; artifactId: string }
  | { type: "UNPIN_EVIDENCE"; artifactId: string }
  | { type: "DEAL_PRESSURE_CARD"; tactic: PressureTactic }
  | { type: "COMMIT_VERDICT"; verdict: Verdict; at: string }
  | { type: "RESET_CASE"; at: string };

export type EngineRejection =
  | "CASE_MISMATCH"
  | "SESSION_COMMITTED"
  | "UNKNOWN_ACTION"
  | "ACTION_LOCKED"
  | "ACTION_ALREADY_TAKEN"
  | "UNKNOWN_ARTIFACT"
  | "ARTIFACT_LOCKED"
  | "ARTIFACT_NOT_REVEALED"
  | "EVIDENCE_ALREADY_PINNED"
  | "EVIDENCE_NOT_PINNED"
  | "PIN_LIMIT_REACHED"
  | "TACTIC_NOT_ALLOWED"
  | "TACTIC_ALREADY_DEALT"
  | "PRESSURE_LIMIT_REACHED"
  | "MODE_ALREADY_SELECTED"
  | "VERDICT_ALREADY_COMMITTED";

export type TransitionResult =
  | { accepted: true; session: GameSession }
  | { accepted: false; session: GameSession; reason: EngineRejection };

export type ScoreExplanationKey =
  | "verdict.correct"
  | "verdict.incorrect"
  | "verdict.missing"
  | "independence.decisive"
  | "independence.corroborative"
  | "independence.claimant_only"
  | "independence.unresolved_check"
  | "independence.none"
  | "evidence.supporting"
  | "evidence.mixed"
  | "evidence.none"
  | "composure.full"
  | "composure.reduced";

export type ScoreDimension = {
  earned: number;
  maximum: number;
  explanationKey: ScoreExplanationKey;
};

export type ScoreBreakdown = {
  verdict: ScoreDimension;
  independence: ScoreDimension;
  evidenceQuality: ScoreDimension;
  composure: ScoreDimension;
  total: number;
  maximum: 1000;
};

export type ReceiptArtifact = {
  id: string;
  title: string;
  channel: Channel;
  sourceRoot: string;
  sourceRootLabel: string;
  sourceClass: SourceClass;
  pinOrder: number;
};

export type ReceiptSourceBranch = {
  sourceRoot: string;
  sourceRootLabel: string;
  sourceClass: SourceClass;
  artifactIds: string[];
};

export type ReceiptPressureCard = {
  tactic: PressureTactic;
  label: string;
  explanation: string;
  counterAction: string;
};

export type ScoreReceipt = {
  caseId: string;
  caseTitle: string;
  truth: Verdict;
  selectedVerdict: Verdict;
  summary: string;
  score: ScoreBreakdown;
  pinnedArtifacts: ReceiptArtifact[];
  sourceBranches: ReceiptSourceBranch[];
  pressureCards: ReceiptPressureCard[];
  lesson: string;
  realWorldAction: string;
  sourceUrl: string;
  sourceLabel: string;
};
