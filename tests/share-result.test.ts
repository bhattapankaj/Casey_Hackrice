import { describe, expect, it } from "vitest";
import { CASE_01 } from "@/lib/cases/case-01";
import { buildReceipt } from "@/lib/engine/receipt";
import { createInitialSession, reduceSession } from "@/lib/engine/reducer";
import { scoreSession } from "@/lib/engine/score";
import type { GameEvent } from "@/lib/engine/types";
import { buildShareText } from "@/lib/share-result";

function play(events: GameEvent[]) {
  return events.reduce(
    (session, event) => reduceSession(CASE_01, session, event),
    createInitialSession(CASE_01, "2026-09-13T00:00:00.000Z"),
  );
}

describe("share result", () => {
  it("copies three plain lines with case, verdict, independence, and URL", () => {
    const session = play([
      { type: "TAKE_ACTION", actionId: "find-harlow-directory" },
      { type: "TAKE_ACTION", actionId: "call-directory-number" },
      { type: "PIN_EVIDENCE", artifactId: "directory-call" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: "2026-09-13T00:01:00.000Z" },
    ]);
    const receipt = buildReceipt(CASE_01, session, scoreSession(CASE_01, session));
    const text = buildShareText(receipt, "https://casey.example");
    const lines = text.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("The Meridian Offer");
    expect(lines[1]).toBe("Scam. Independent chain.");
    expect(lines[2]).toBe("https://casey.example/play/case-01");
    expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    expect(text).not.toContain("\u2014");
  });

  it("says the chain was not independent when only claimant cards are pinned", () => {
    const session = play([
      { type: "PIN_EVIDENCE", artifactId: "offer-email" },
      { type: "COMMIT_VERDICT", verdict: "scam", at: "2026-09-13T00:01:00.000Z" },
    ]);
    const receipt = buildReceipt(CASE_01, session, scoreSession(CASE_01, session));
    expect(buildShareText(receipt, "https://casey.example").split("\n")[1]).toBe(
      "Scam. No independent chain.",
    );
  });
});
