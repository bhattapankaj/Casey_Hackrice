export const PLAYER_PROFILE_STORAGE_KEY = "casey.player.v1";
export const PLAYER_NAME_MAX_LENGTH = 40;

export type PlayerProfile = {
  version: 1;
  name: string;
};

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\p{N} .'’-]*$/u;

export function normalizePlayerName(value: unknown): string | null {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/u.test(value)) {
    return null;
  }

  const name = value.normalize("NFKC").replace(/\s+/gu, " ").trim();
  if (
    name.length === 0 ||
    Array.from(name).length > PLAYER_NAME_MAX_LENGTH ||
    !NAME_PATTERN.test(name)
  ) {
    return null;
  }
  return name;
}

export function serializePlayerProfile(name: string): string {
  const normalized = normalizePlayerName(name);
  if (!normalized) {
    throw new Error("Player name is invalid");
  }
  return JSON.stringify({ version: 1, name: normalized } satisfies PlayerProfile);
}

export function parsePlayerProfile(raw: string | null): PlayerProfile | null {
  if (!raw) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return null;
    }
    const profile = value as Record<string, unknown>;
    if (profile.version !== 1) {
      return null;
    }
    const name = normalizePlayerName(profile.name);
    return name ? { version: 1, name } : null;
  } catch {
    return null;
  }
}
