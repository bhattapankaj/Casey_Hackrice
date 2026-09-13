import { beforeEach, describe, expect, it, vi } from "vitest";

const write = vi.fn();

vi.mock("@/lib/db/board.server", () => ({
  emptySnapshot: () => ({
    entries: [],
    stats: { playersTonight: 0, casesPlayed: 0, case01WrongPercent: null },
  }),
  getBoardStore: () => ({
    write,
    read: async () => ({
      entries: [],
      stats: { playersTonight: 0, casesPlayed: 0, case01WrongPercent: null },
    }),
  }),
}));

describe("board API rescore", () => {
  beforeEach(() => {
    write.mockReset();
    vi.resetModules();
  });

  it("writes the engine score and ignores a client total", async () => {
    const { POST } = await import("@/app/api/board/route");
    const response = await POST(
      new Request("http://localhost/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: "01994677-4a80-7a55-8dc2-0242ac120002",
          nickname: "Jordan",
          score: 9999,
          caseResults: {
            "case-01": { verdict: "scam", pinnedArtifactIds: ["offer-email"] },
          },
        }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.score).toBe(75);
    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: "01994677-4a80-7a55-8dc2-0242ac120002",
        nickname: "Jordan",
        score: 75,
        casesCleared: 1,
      }),
    );
  });

  it("rejects cross-origin writes and missing submission identities", async () => {
    const { POST } = await import("@/app/api/board/route");
    const crossOrigin = await POST(
      new Request("http://localhost/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://attacker.test" },
        body: "{}",
      }),
    );
    expect(crossOrigin.status).toBe(403);

    const missingIdentity = await POST(
      new Request("http://localhost/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: "Jordan",
          caseResults: {
            "case-01": { verdict: "scam", pinnedArtifactIds: ["offer-email"] },
          },
        }),
      }),
    );
    expect(missingIdentity.status).toBe(400);
    expect(write).not.toHaveBeenCalled();
  });
});
