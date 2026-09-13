export type BoardRow = {
  id: string;
  nickname: string;
  score: number;
  casesCleared: number;
  createdAt: string;
  you?: boolean;
};

export type BoardStats = {
  playersTonight: number;
  casesPlayed: number;
  case01WrongPercent: number | null;
};

export type BoardPayload = {
  source: "shared" | "local";
  entries: BoardRow[];
  stats: BoardStats;
};
