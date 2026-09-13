import { describe, expect, it } from "vitest";
import { CASE_01 } from "@/lib/cases/case-01";
import type { CaseFile } from "@/lib/cases/schema";
import { buildReceipt } from "@/lib/engine/receipt";
import {
  createInitialSession,
  reduceSession,
  transitionSession,
} from "@/lib/engine/reducer";
import { scoreSession } from "@/lib/engine/score";
import type { GameEvent, GameSession } from "@/lib/engine/types";

const START = "2026-09-12T12:00:00.000Z";
const COMMIT = "2026-09-12T12:01:00.000Z";

function play(events: GameEvent[], caseFile: CaseFile = CASE_01): GameSession {
  return events.reduce(
    (session, event) => reduceSession(caseFile, session, event),
    createInitialSession(caseFile, START),
  );
}

describe("deterministic session reducer", () => {
  it("reveals only authored starting evidence", () => {
    const session = createInitialSession(CASE_01, START);
    expect(session.revealedArtifactIds).toEqual(["offer-email"]);
    expect(session.pinnedArtifactIds).toEqual([]);
  });

  it("takes only known unlocked actions and reveals their authored artifacts", () => {
    const initial = createInitialSession(CASE_01, START);
    expect(
      transitionSession(CASE_01, initial, {
        type: "TAKE_ACTION",
        actionId: "unknown",
      }),
    ).toMatchObject({ accepted: false, reason: "UNKNOWN_ACTION" });
    expect(
      transitionSession(CASE_01, initial, {
        type: "TAKE_ACTION",
        actionId: "call-directory-number",
      }),
    ).toMatchObject({ accepted: false, reason: "ACTION_LOCKED" });
    expect(
      transitionSession(CASE_01, initial, {
        type: "REVEAL_ARTIFACT",
        artifactId: "directory-call",
      }),
    ).toMatchObject({ accepted: false, reason: "ARTIFACT_LOCKED" });

    const session = play([
      { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
      { type: "TAKE_ACTION", actionId: "call-directory-number" },
    ]);
    expect(session.revealedArtifactIds).toEqual([
      "offer-email",
      "official-directory",
      "directory-call",
    ]);
  });

  it("pins only revealed evidence, keeps order, ignores duplicates, and caps at three", () => {
    let session = play([
      { type: "TAKE_ACTION", actionId: "call-supplied-number" },
      { type: "TAKE_ACTION", actionId: "open-supplied-staff-page" },
      { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
      { type: "PIN_EVIDENCE", artifactId: "offer-email" },
      { type: "PIN_EVIDENCE", artifactId: "supplied-call" },
      { type: "PIN_EVIDENCE", artifactId: "official-directory" },
    ]);
    expect(session.pinnedArtifactIds).toEqual([
      "offer-email",
      "supplied-call",
      "official-directory",
    ]);
    expect(
      transitionSession(CASE_01, session, {
        type: "PIN_EVIDENCE",
        artifactId: "offer-email",
      }),
    ).toMatchObject({ accepted: false, reason: "EVIDENCE_ALREADY_PINNED" });
    expect(
      transitionSession(CASE_01, session, {
        type: "PIN_EVIDENCE",
        artifactId: "supplied-staff-page",
      }),
    ).toMatchObject({ accepted: false, reason: "PIN_LIMIT_REACHED" });

    session = reduceSession(CASE_01, session, {
      type: "UNPIN_EVIDENCE",
      artifactId: "supplied-call",
    });
    session = reduceSession(CASE_01, session, {
      type: "PIN_EVIDENCE",
      artifactId: "supplied-staff-page",
    });
    expect(session.pinnedArtifactIds).toEqual([
      "offer-email",
      "official-directory",
      "supplied-staff-page",
    ]);

    const initial = createInitialSession(CASE_01, START);
    expect(
      transitionSession(CASE_01, initial, {
        type: "PIN_EVIDENCE",
        artifactId: "directory-call",
      }),
    ).toMatchObject({ accepted: false, reason: "ARTIFACT_NOT_REVEALED" });
  });

  it("accepts only unique allowlisted pressure cards and caps them at three", () => {
    let session = play([
      { type: "DEAL_PRESSURE_CARD", tactic: "urgency" },
      { type: "DEAL_PRESSURE_CARD", tactic: "authority" },
      { type: "DEAL_PRESSURE_CARD", tactic: "scarcity" },
    ]);
    expect(
      transitionSession(CASE_01, session, {
        type: "DEAL_PRESSURE_CARD",
        tactic: "urgency",
      }),
    ).toMatchObject({ accepted: false, reason: "TACTIC_ALREADY_DEALT" });
    expect(
      transitionSession(CASE_01, session, {
        type: "DEAL_PRESSURE_CARD",
        tactic: "reciprocity",
      }),
    ).toMatchObject({ accepted: false, reason: "PRESSURE_LIMIT_REACHED" });

    const restricted = structuredClone(CASE_01) as CaseFile;
    restricted.allowedPressureTactics = ["urgency"];
    session = createInitialSession(restricted, START);
    expect(
      transitionSession(restricted, session, {
        type: "DEAL_PRESSURE_CARD",
        tactic: "authority",
      }),
    ).toMatchObject({ accepted: false, reason: "TACTIC_NOT_ALLOWED" });
  });

  it("commits once, locks scored state, and resets cleanly", () => {
    let session = play([
      { type: "DEAL_PRESSURE_CARD", tactic: "urgency" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
    ]);
    const locked = transitionSession(CASE_01, session, {
      type: "TAKE_ACTION",
      actionId: "find-harlow-directory",
    });
    expect(locked).toMatchObject({ accepted: false, reason: "SESSION_COMMITTED" });
    expect(
      transitionSession(CASE_01, session, {
        type: "COMMIT_VERDICT",
        verdict: "legit",
        at: COMMIT,
      }),
    ).toMatchObject({ accepted: false, reason: "VERDICT_ALREADY_COMMITTED" });

    session = reduceSession(CASE_01, session, {
      type: "RESET_CASE",
      at: "2026-09-12T13:00:00.000Z",
    });
    expect(session.pressureTactics).toEqual([]);
    expect(session.verdict).toBeUndefined();
    expect(session.revealedArtifactIds).toEqual(["offer-email"]);
  });

  it("preserves progress when a failed live call switches to fallback", () => {
    const session = play([
      { type: "SELECT_MODE", mode: "live_voice", at: START },
      { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
      { type: "SELECT_MODE", mode: "text_fallback", at: COMMIT },
    ]);
    expect(session.mode).toBe("text_fallback");
    expect(session.actionIds).toEqual(["find-harlow-directory"]);
    expect(session.revealedArtifactIds).toContain("official-directory");
  });
});

describe("score and Receipt", () => {
  const idealEvents: GameEvent[] = [
    { type: "SELECT_MODE", mode: "text_fallback", at: START },
    { type: "DEAL_PRESSURE_CARD", tactic: "urgency" },
    { type: "TAKE_ACTION", actionId: "call-supplied-number" },
    { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
    { type: "TAKE_ACTION", actionId: "call-directory-number" },
    { type: "PIN_EVIDENCE", artifactId: "offer-email" },
    { type: "PIN_EVIDENCE", artifactId: "directory-call" },
    { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
  ];

  it("awards the exact four dimensions and an ideal 1,000", () => {
    const session = play(idealEvents);
    expect(scoreSession(CASE_01, session)).toEqual({
      verdict: { earned: 400, maximum: 400, explanationKey: "verdict.correct" },
      independence: {
        earned: 300,
        maximum: 300,
        explanationKey: "independence.decisive",
      },
      evidenceQuality: {
        earned: 200,
        maximum: 200,
        explanationKey: "evidence.supporting",
      },
      composure: { earned: 100, maximum: 100, explanationKey: "composure.full" },
      total: 1000,
      maximum: 1000,
    });
  });

  it("caps a correct empty-evidence guess at 500", () => {
    const session = play([{ type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT }]);
    const score = scoreSession(CASE_01, session);
    expect(score.total).toBe(500);
    expect(score.independence.earned).toBe(0);
    expect(score.evidenceQuality.earned).toBe(0);
  });

  it("does not count artifacts that were revealed and opened but never pinned", () => {
    const session = play([
      { type: "TAKE_ACTION", actionId: "call-supplied-number" },
      { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
      { type: "TAKE_ACTION", actionId: "call-directory-number" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
    ]);
    expect(session.revealedArtifactIds).toHaveLength(4);
    expect(session.pinnedArtifactIds).toEqual([]);
    expect(scoreSession(CASE_01, session)).toMatchObject({
      independence: { earned: 0 },
      evidenceQuality: { earned: 0 },
      total: 500,
    });
  });

  it("awards zero verdict points for an incorrect verdict", () => {
    const session = play([{ type: "COMMIT_VERDICT", verdict: "legit", at: COMMIT }]);
    expect(scoreSession(CASE_01, session).verdict.earned).toBe(0);
  });

  it("awards 150 for independent corroboration and zero for claimant-only proof", () => {
    const corroborative = structuredClone(CASE_01) as CaseFile;
    const directory = corroborative.artifacts.find((item) => item.id === "official-directory")!;
    directory.supports = ["scam"];
    directory.evidenceWeight = 50;
    const independentSession = play(
      [
        { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
        { type: "PIN_EVIDENCE", artifactId: "official-directory" },
        { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
      ],
      corroborative,
    );
    expect(scoreSession(corroborative, independentSession).independence.earned).toBe(150);

    const claimantSession = play([
      { type: "PIN_EVIDENCE", artifactId: "offer-email" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
    ]);
    expect(scoreSession(CASE_01, claimantSession).independence.earned).toBe(0);
  });

  it("subtracts contradictions, clamps evidence, and clamps composure", () => {
    const contradictory = structuredClone(CASE_01) as CaseFile;
    const suppliedCall = contradictory.artifacts.find(
      (artifact) => artifact.id === "supplied-call",
    )!;
    const staffPage = contradictory.artifacts.find(
      (artifact) => artifact.id === "supplied-staff-page",
    )!;
    suppliedCall.contradicts = ["scam"];
    suppliedCall.evidenceWeight = 50;
    staffPage.contradicts = ["scam"];
    staffPage.evidenceWeight = 50;

    const session = play([
      { type: "TAKE_ACTION", actionId: "call-supplied-number" },
      { type: "TAKE_ACTION", actionId: "open-supplied-staff-page" },
      { type: "TAKE_ACTION", actionId: "send-fictional-id-form" },
      { type: "PIN_EVIDENCE", artifactId: "offer-email" },
      { type: "PIN_EVIDENCE", artifactId: "supplied-call" },
      { type: "PIN_EVIDENCE", artifactId: "supplied-staff-page" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
    ], contradictory);
    const score = scoreSession(contradictory, session);
    expect(score.evidenceQuality.earned).toBe(0);
    expect(score.composure.earned).toBe(0);
  });

  it("does not score time, mode, transcripts, or pressure cards", () => {
    const baseline = play([
      { type: "PIN_EVIDENCE", artifactId: "offer-email" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
    ]);
    const noisy = {
      ...baseline,
      mode: "live_voice" as const,
      pressureTactics: ["urgency", "authority"] as GameSession["pressureTactics"],
      timestamps: {
        startedAt: "2000-01-01T00:00:00.000Z",
        committedAt: "2099-01-01T00:00:00.000Z",
      },
    };
    const changedTranscript = structuredClone(CASE_01) as CaseFile;
    const call = changedTranscript.artifacts.find(
      (artifact) => artifact.id === "supplied-call",
    )!;
    if (call.content.kind === "call") {
      call.content.transcript = [
        "Untrusted transcript text that claims the truth is different.",
      ];
    }
    expect(scoreSession(CASE_01, noisy)).toEqual(scoreSession(CASE_01, baseline));
    expect(scoreSession(changedTranscript, noisy)).toEqual(
      scoreSession(CASE_01, baseline),
    );
  });

  it("groups multiple channels under one source and is deterministic and immutable", () => {
    const session = play([
      { type: "TAKE_ACTION", actionId: "call-supplied-number" },
      { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
      { type: "TAKE_ACTION", actionId: "call-directory-number" },
      { type: "PIN_EVIDENCE", artifactId: "offer-email" },
      { type: "PIN_EVIDENCE", artifactId: "supplied-call" },
      { type: "PIN_EVIDENCE", artifactId: "directory-call" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
    ]);
    const score = scoreSession(CASE_01, session);
    const first = buildReceipt(CASE_01, session, score);
    const second = buildReceipt(CASE_01, session, score);
    expect(first).toEqual(second);
    expect(first.sourceBranches).toEqual([
      {
        sourceRoot: "meridian-claimant",
        sourceRootLabel: "Meridian claimant",
        sourceClass: "claimant",
        artifactIds: ["offer-email", "supplied-call"],
      },
      {
        sourceRoot: "harlow-university",
        sourceRootLabel: "Harlow University",
        sourceClass: "independent",
        artifactIds: ["directory-call"],
      },
    ]);
    expect(first.pressureCards).toEqual([]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.sourceBranches[0])).toBe(true);
  });

  it("proves the reviewer Trust Chain path with three pinned artifacts", () => {
    const session = play([
      { type: "TAKE_ACTION", actionId: "call-supplied-number" },
      { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
      { type: "TAKE_ACTION", actionId: "call-directory-number" },
      { type: "PIN_EVIDENCE", artifactId: "offer-email" },
      { type: "PIN_EVIDENCE", artifactId: "supplied-call" },
      { type: "PIN_EVIDENCE", artifactId: "directory-call" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
    ]);
    const receipt = buildReceipt(CASE_01, session, scoreSession(CASE_01, session));

    expect(receipt.score.total).toBe(1000);
    expect(receipt.sourceBranches).toEqual([
      {
        sourceRoot: "meridian-claimant",
        sourceRootLabel: "Meridian claimant",
        sourceClass: "claimant",
        artifactIds: ["offer-email", "supplied-call"],
      },
      {
        sourceRoot: "harlow-university",
        sourceRootLabel: "Harlow University",
        sourceClass: "independent",
        artifactIds: ["directory-call"],
      },
    ]);
  });

  it("credits not-enough-evidence only after an unresolved independent check", () => {
    const unresolved = structuredClone(CASE_01) as CaseFile;
    unresolved.id = "case-03";
    unresolved.truth = "not_enough_evidence";
    unresolved.artifacts.forEach((artifact) => {
      artifact.decisive = false;
      artifact.supports = [];
    });

    const guess = play(
      [
        {
          type: "COMMIT_VERDICT",
          verdict: "not_enough_evidence",
          at: COMMIT,
        },
      ],
      unresolved,
    );
    expect(scoreSession(unresolved, guess).independence.earned).toBe(0);

    const checked = play(
      [
        { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
        {
          type: "COMMIT_VERDICT",
          verdict: "not_enough_evidence",
          at: COMMIT,
        },
      ],
      unresolved,
    );
    expect(scoreSession(unresolved, checked).independence).toMatchObject({
      earned: 300,
      explanationKey: "independence.unresolved_check",
    });
  });
});
