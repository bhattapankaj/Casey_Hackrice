import { CASE_ORDER, type CaseTruth, type Verdict } from "@/lib/cases";

const STORAGE_KEY = "casey-session";
const DEFAULT_SCORE = 240;

export type CaseResult = {
  verdict: Verdict;
  truth: CaseTruth;
  correct: boolean;
  delta: number;
  evidenceCount: number;
  independentCount: number;
};

export type GameSession = {
  score: number;
  /** Per-case delta, so re-playing a case replaces its points instead of adding again. */
  deltas: Record<string, number>;
  results: Record<string, CaseResult>;
  nickname: string;
  /** The score already posted to the board, so a repeat submit is a no-op. */
  postedScore: number | null;
};

export function defaultSession(): GameSession {
  return {
    score: DEFAULT_SCORE,
    deltas: {},
    results: {},
    nickname: "",
    postedScore: null,
  };
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
      results: parsed.results ?? {},
      nickname: parsed.nickname ?? "",
      postedScore:
        typeof parsed.postedScore === "number" ? parsed.postedScore : null,
    };
  } catch {
    return defaultSession();
  }
}

export function writeSession(session: GameSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/**
 * Record a case outcome. Replaying a case overwrites its previous contribution,
 * so points are never counted twice.
 */
export function recordCaseResult(
  caseId: string,
  delta: number,
  result: CaseResult,
): GameSession {
  const session = readSession();
  const previous = session.deltas[caseId] ?? 0;
  session.score = session.score - previous + delta;
  session.deltas[caseId] = delta;
  session.results[caseId] = result;
  writeSession(session);
  return session;
}

export function saveNickname(nickname: string) {
  const session = readSession();
  session.nickname = nickname.trim();
  writeSession(session);
}

export function markPosted(score: number) {
  const session = readSession();
  session.postedScore = score;
  writeSession(session);
}

export function resetRun() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

/** The first case with no recorded result, or undefined when the run is complete. */
export function nextUnplayedCase(session: GameSession): string | undefined {
  return CASE_ORDER.find((id) => !session.results[id]);
}

export function completedCount(session: GameSession): number {
  return CASE_ORDER.filter((id) => session.results[id]).length;
}
