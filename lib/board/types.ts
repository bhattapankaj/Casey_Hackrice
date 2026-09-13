import type { Hand } from "@/lib/engine/hand";

export type BoardRow = {
  id: string;
  nickname: string;
  username: string;
  score: number;
  casesCleared: number;
  bestHand: Hand | null;
  chips: number;
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
