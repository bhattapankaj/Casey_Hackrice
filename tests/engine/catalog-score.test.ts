import { describe, expect, it } from "vitest";
import { CASE_01 } from "@/lib/cases/case-01";
import type { CaseFile } from "@/lib/cases/schema";
import { scoreCatalogRound } from "@/lib/engine/catalog-score";
import { createInitialSession, reduceSession } from "@/lib/engine/reducer";
import type { GameEvent, GameSession } from "@/lib/engine/types";

const START = "2026-09-12T12:00:00.000Z";
const COMMIT = "2026-09-12T12:01:00.000Z";

function play(events: GameEvent[], caseFile: CaseFile = CASE_01): GameSession {
  return events.reduce(
    (session, event) => reduceSession(caseFile, session, event),
    createInitialSession(caseFile, START),
  );
}

function unresolvedCase(): CaseFile {
  const copy = structuredClone(CASE_01) as CaseFile;
  copy.id = "case-unresolvable";
  copy.truth = "not_enough_evidence";
  copy.artifacts.forEach((artifact) => {
    artifact.decisive = false;
    artifact.supports = [];
    artifact.contradicts = undefined;
  });
  return copy;
}

describe("catalog scoring", () => {
  it("scores a correct call with only in-band evidence as 75", () => {
    const session = play([
      { type: "PIN_EVIDENCE", artifactId: "offer-email" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
    ]);
    expect(scoreCatalogRound(CASE_01, session)).toEqual({
      total: 75,
      correct: true,
      usedOutOfBand: false,
    });
  });

  it("scores a correct call with mixed bands as 150", () => {
    const session = play([
      { type: "PIN_EVIDENCE", artifactId: "offer-email" },
      { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
      { type: "TAKE_ACTION", actionId: "call-directory-number" },
      { type: "PIN_EVIDENCE", artifactId: "directory-call" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
    ]);
    expect(scoreCatalogRound(CASE_01, session)).toEqual({
      total: 150,
      correct: true,
      usedOutOfBand: true,
    });
  });

  it("scores a wrong call with perfect evidence as 0", () => {
    const session = play([
      { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
      { type: "TAKE_ACTION", actionId: "call-directory-number" },
      { type: "PIN_EVIDENCE", artifactId: "directory-call" },
      { type: "COMMIT_VERDICT", verdict: "legit", at: COMMIT },
    ]);
    expect(scoreCatalogRound(CASE_01, session)).toEqual({
      total: 0,
      correct: false,
      usedOutOfBand: true,
    });
  });

  it("scores an unresolvable case answered correctly as 100", () => {
    const caseFile = unresolvedCase();
    const session = play(
      [
        { type: "PIN_EVIDENCE", artifactId: "offer-email" },
        { type: "COMMIT_VERDICT", verdict: "not_enough_evidence", at: COMMIT },
      ],
      caseFile,
    );
    expect(scoreCatalogRound(caseFile, session)).toEqual({
      total: 100,
      correct: true,
      usedOutOfBand: false,
    });
  });

  it("scores an unresolvable case answered as scam as 0", () => {
    const caseFile = unresolvedCase();
    const session = play(
      [
        { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
        { type: "TAKE_ACTION", actionId: "call-directory-number" },
        { type: "PIN_EVIDENCE", artifactId: "directory-call" },
        { type: "COMMIT_VERDICT", verdict: "scam", at: COMMIT },
      ],
      caseFile,
    );
    expect(scoreCatalogRound(caseFile, session)).toEqual({
      total: 0,
      correct: false,
      usedOutOfBand: true,
    });
  });

  it("never returns a negative case score", () => {
    const session = play([
      { type: "PIN_EVIDENCE", artifactId: "offer-email" },
      { type: "COMMIT_VERDICT", verdict: "legit", at: COMMIT },
    ]);
    expect(scoreCatalogRound(CASE_01, session).total).toBe(0);
  });
});
