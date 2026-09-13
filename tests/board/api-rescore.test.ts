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
      expect.objectContaining({ nickname: "Jordan", score: 75, casesCleared: 1 }),
    );
  });
});
