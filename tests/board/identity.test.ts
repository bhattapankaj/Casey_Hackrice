import { describe, expect, it } from "vitest";
import { boardUsername, suggestBoardNickname } from "@/lib/board/identity";

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

  it("suggests an editable 221B-style nickname within the board limit", () => {
    expect(suggestBoardNickname("Jeevan")).toBe("Jeevan-Sleuth-221B");
    expect(suggestBoardNickname("Jordan Lee")).toBe("JordanLe-Sleuth-221B");
    expect(suggestBoardNickname("Ana María")).toBe("AnaMaria-Sleuth-221B");
    expect(suggestBoardNickname("A very long detective name")).toBe("Averylon-Sleuth-221B");
    expect(suggestBoardNickname("A very long detective name")).toHaveLength(20);
  });
});
