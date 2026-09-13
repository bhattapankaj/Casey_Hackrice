import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/board.server", () => ({
  emptySnapshot: () => ({
    entries: [],
    stats: { playersTonight: 0, casesPlayed: 0, case01WrongPercent: null },
  }),
  getBoardStore: () => null,
}));

describe("board API fallback", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("GET stays successful when no shared store is configured", async () => {
    const { GET } = await import("@/app/api/board/route");
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.unavailable).toBe(true);
    expect(body.entries).toEqual([]);
  });

  it("POST does not accept a client score field", async () => {
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
    expect(body.score).toBeUndefined();
    expect(response.status).toBe(503);
    expect(body.unavailable).toBe(true);
  });
});
