import { describe, expect, it } from "vitest";
import { hasBoardAccess } from "@/lib/board/access";

const PLAYER = JSON.stringify({ version: 1, name: "Jordan" });
const PROGRESS = JSON.stringify({
  version: 1,
  nickname: "Jordan-Hound-221B",
  nicknameAsked: true,
  chips: 100,
  cases: {},
});

describe("board access gate", () => {
  it("requires both a valid player name and valid nickname", () => {
    expect(hasBoardAccess(PLAYER, PROGRESS)).toBe(true);
    expect(hasBoardAccess(null, PROGRESS)).toBe(false);
    expect(hasBoardAccess(PLAYER, null)).toBe(false);
    expect(
      hasBoardAccess(
        PLAYER,
        JSON.stringify({
          version: 1,
          nickname: null,
          nicknameAsked: false,
          chips: 100,
          cases: {},
        }),
      ),
    ).toBe(false);
  });

  it("rejects malformed storage instead of granting access", () => {
    expect(hasBoardAccess("{", PROGRESS)).toBe(false);
    expect(hasBoardAccess(PLAYER, "{")).toBe(false);
    expect(
      hasBoardAccess(
        PLAYER,
        JSON.stringify({
          version: 1,
          nickname: "Invalid<script>",
          nicknameAsked: true,
          chips: 100,
          cases: {},
        }),
      ),
    ).toBe(false);
  });
});
