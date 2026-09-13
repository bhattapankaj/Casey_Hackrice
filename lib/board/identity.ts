/**
 * Appends a stable, easy-to-track suffix to the chosen board name. The full UUID remains
 * the collision-proof database identity; this shorter username is for human-readable rows.
 */
export function boardUsername(nickname: string, submissionId: string): string {
  const compact = submissionId.toLowerCase().replace(/[^0-9a-f]/g, "");
  const name = nickname.trim().replace(/\s+/g, "_") || "Player";
  return `${name}-${compact.slice(0, 6).padEnd(6, "0").toUpperCase()}`;
}
