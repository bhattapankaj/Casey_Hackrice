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
export const SHERLOCK_CODENAMES = [
  "Adler",
  "Baker",
  "Bohemian",
  "Cipher",
  "Deduction",
  "Hound",
  "Irregular",
  "Lantern",
  "Lestrade",
  "Magnifier",
  "Mycroft",
  "Violin",
  "Watson",
] as const;

export type SherlockCodename = (typeof SHERLOCK_CODENAMES)[number];

export function isLegacySleuthNickname(nickname: string): boolean {
  return /^[A-Za-z0-9]+-Sleuth-221B$/.test(nickname);
}

export function randomSherlockCodename(
  random: () => number = Math.random,
  exclude?: SherlockCodename,
): SherlockCodename {
  const choices = exclude
    ? SHERLOCK_CODENAMES.filter((codename) => codename !== exclude)
    : [...SHERLOCK_CODENAMES];
  const value = random();
  const unit = Number.isFinite(value) ? Math.min(Math.max(value, 0), 0.999999999) : 0;
  return choices[Math.floor(unit * choices.length)] ?? SHERLOCK_CODENAMES[0];
}

export function suggestBoardNickname(
  playerName: string,
  codename: SherlockCodename = randomSherlockCodename(),
): string {
  const compact = playerName
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9]/g, "");
  const base = compact || "Detective";
  const maxNameLength = 20 - codename.length - "--221B".length;
  return `${Array.from(base).slice(0, maxNameLength).join("")}-${codename}-221B`;
}
