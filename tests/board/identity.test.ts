import { describe, expect, it } from "vitest";
import { boardUsername } from "@/lib/board/identity";

describe("leaderboard username", () => {
  it("appends a stable alphanumeric suffix to the board name", () => {
    const id = "01994677-4a80-7a55-8dc2-0242ac120002";
    expect(boardUsername("Jordan Lee", id)).toBe("Jordan_Lee-019946");
    expect(boardUsername("Jordan Lee", id)).toBe(boardUsername("Jordan Lee", id));
  });

  it("gives duplicate names distinct usernames when their row identities differ", () => {
    expect(
      boardUsername("Jordan", "01994677-4a80-7a55-8dc2-0242ac120002"),
    ).not.toBe(
      boardUsername("Jordan", "a1994677-4a80-7a55-8dc2-0242ac120002"),
    );
  });
});
