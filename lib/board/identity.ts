/**
 * Appends a stable, easy-to-track suffix to the chosen board name. The full UUID remains
 * the collision-proof database identity; this shorter username is for human-readable rows.
 */
export function boardUsername(nickname: string, submissionId: string): string {
  const compact = submissionId.toLowerCase().replace(/[^0-9a-f]/g, "");
  const name = nickname.trim().replace(/\s+/g, "_") || "Player";
  return `${name}-${compact.slice(0, 6).padEnd(6, "0").toUpperCase()}`;
}

/** Builds the editable, Sherlock-themed suggestion shown beside the private player name. */
export function suggestBoardNickname(playerName: string): string {
  const compact = playerName
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9]/g, "");
  const base = compact || "Detective";
  const codename = "Sleuth";
  const maxNameLength = 20 - codename.length - "--221B".length;
  return `${Array.from(base).slice(0, maxNameLength).join("")}-${codename}-221B`;
}
