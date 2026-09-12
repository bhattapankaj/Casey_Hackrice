const STORAGE_KEY = "casey-session";
const DEFAULT_SCORE = 240;

export type GameSession = {
  score: number;
  deltas: Record<string, number>;
  nickname: string;
};

export function defaultSession(): GameSession {
  return { score: DEFAULT_SCORE, deltas: {}, nickname: "" };
}

export function readSession(): GameSession {
  if (typeof window === "undefined") {
    return defaultSession();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSession();
    }
    const parsed = JSON.parse(raw) as Partial<GameSession>;
    return {
      score: typeof parsed.score === "number" ? parsed.score : DEFAULT_SCORE,
      deltas: parsed.deltas ?? {},
      nickname: parsed.nickname ?? "",
    };
  } catch {
    return defaultSession();
  }
}

export function writeSession(session: GameSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function applyCaseDelta(caseId: string, delta: number): number {
  const session = readSession();
  const previous = session.deltas[caseId] ?? 0;
  session.score = session.score - previous + delta;
  session.deltas[caseId] = delta;
  writeSession(session);
  return session.score;
}

export function saveNickname(nickname: string) {
  const session = readSession();
  session.nickname = nickname.trim();
  writeSession(session);
}
