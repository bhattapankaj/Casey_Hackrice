const STORAGE_KEY = "casey-board";

export type BoardEntry = {
  name: string;
  score: number;
  /** Bundled demo rows. They are not other players and never claim to be. */
  sample: boolean;
  /** The row belonging to the person at this browser. */
  you?: boolean;
};

const SAMPLE: BoardEntry[] = [
  { name: "Amina", score: 390, sample: true },
  { name: "Priya", score: 310, sample: true },
  { name: "Jonah", score: 240, sample: true },
  { name: "Wes", score: 215, sample: true },
];

function sortEntries(entries: BoardEntry[]): BoardEntry[] {
  return [...entries].sort((a, b) => b.score - a.score);
}

export function readBoard(): BoardEntry[] {
  if (typeof window === "undefined") {
    return sortEntries(SAMPLE);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return sortEntries(SAMPLE);
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return sortEntries(SAMPLE);
    }
    const own = parsed
      .filter(
        (entry): entry is { name: string; score: number } =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as { name?: unknown }).name === "string" &&
          typeof (entry as { score?: unknown }).score === "number",
      )
      .map((entry) => ({ name: entry.name, score: entry.score, sample: false, you: true }));
    return sortEntries([...SAMPLE, ...own]);
  } catch {
    return sortEntries(SAMPLE);
  }
}

/** Stores only the player's own rows. Sample rows are never persisted. */
export function postScore(name: string, score: number): BoardEntry[] {
  const trimmed = name.trim();
  const existing = readBoard()
    .filter((entry) => !entry.sample && entry.name !== trimmed)
    .map(({ name: n, score: s }) => ({ name: n, score: s }));
  existing.push({ name: trimmed, score });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return readBoard();
}
