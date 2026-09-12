const STORAGE_KEY = "casey-board";

export type BoardEntry = {
  name: string;
  score: number;
};

const SEED: BoardEntry[] = [
  { name: "Amina", score: 390 },
  { name: "Priya", score: 310 },
  { name: "Jonah", score: 240 },
  { name: "Wes", score: 215 },
];

export function readBoard(): BoardEntry[] {
  if (typeof window === "undefined") {
    return SEED;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [...SEED];
    }
    const parsed = JSON.parse(raw) as BoardEntry[];
    if (!Array.isArray(parsed)) {
      return [...SEED];
    }
    return parsed;
  } catch {
    return [...SEED];
  }
}

export function postScore(name: string, score: number): BoardEntry[] {
  const trimmed = name.trim();
  const board = readBoard().filter((entry) => entry.name !== trimmed);
  board.push({ name: trimmed, score });
  board.sort((a, b) => b.score - a.score);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  return board;
}
