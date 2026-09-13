import { describe, expect, it } from "vitest";
import {
  normalizePlayerName,
  parsePlayerProfile,
  serializePlayerProfile,
} from "@/lib/player-profile";

describe("local player profile", () => {
  it("normalizes and serializes a required name as versioned JSON", () => {
    expect(normalizePlayerName("  Ana   María  ")).toBe("Ana María");
    expect(JSON.parse(serializePlayerProfile("Ana María"))).toEqual({
      version: 1,
      name: "Ana María",
    });
  });

  it.each(["", "   ", "<script>", "A\nB", "A".repeat(41)])(
    "rejects invalid name input %j",
    (name) => expect(normalizePlayerName(name)).toBeNull(),
  );

  it("treats malformed or stale local JSON as untrusted", () => {
    expect(parsePlayerProfile("not-json")).toBeNull();
    expect(parsePlayerProfile(JSON.stringify({ version: 2, name: "Ana" }))).toBeNull();
    expect(parsePlayerProfile(JSON.stringify({ version: 1, name: "<Ana>" }))).toBeNull();
    expect(parsePlayerProfile(JSON.stringify({ version: 1, name: "Ana" }))).toEqual({
      version: 1,
      name: "Ana",
    });
  });
});
