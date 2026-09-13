import { describe, expect, it } from "vitest";
import {
  SHERLOCK_CODENAMES,
  boardUsername,
  isLegacySleuthNickname,
  randomSherlockCodename,
  suggestBoardNickname,
} from "@/lib/board/identity";

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

  it("deals different Sherlock codenames from a curated pool", () => {
    expect(randomSherlockCodename(() => 0)).toBe(SHERLOCK_CODENAMES[0]);
    expect(randomSherlockCodename(() => 0.999999)).toBe(
      SHERLOCK_CODENAMES.at(-1),
    );
    expect(randomSherlockCodename(() => 0, SHERLOCK_CODENAMES[0])).not.toBe(
      SHERLOCK_CODENAMES[0],
    );
    expect(new Set(SHERLOCK_CODENAMES).size).toBeGreaterThan(10);
  });

  it("recognizes only the old generated Sleuth format for migration", () => {
    expect(isLegacySleuthNickname("Jeevan-Sleuth-221B")).toBe(true);
    expect(isLegacySleuthNickname("Jeevan-Hound-221B")).toBe(false);
    expect(isLegacySleuthNickname("My Sleuth alias")).toBe(false);
  });

  it("suggests an editable 221B-style nickname within the board limit", () => {
    expect(suggestBoardNickname("Jeevan", "Hound")).toBe("Jeevan-Hound-221B");
    expect(suggestBoardNickname("Jordan Lee", "Watson")).toBe("JordanLe-Watson-221B");
    expect(suggestBoardNickname("Ana María", "Adler")).toBe("AnaMaria-Adler-221B");
    expect(suggestBoardNickname("A very long detective name", "Deduction")).toBe(
      "Avery-Deduction-221B",
    );

    for (const codename of SHERLOCK_CODENAMES) {
      expect(suggestBoardNickname("A very long detective name", codename).length).toBeLessThanOrEqual(20);
    }
  });
});
