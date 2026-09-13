export const STARTING_CHIPS = 100;
export const STAKE_OPTIONS = [10, 25, 50] as const;
export type Stake = (typeof STAKE_OPTIONS)[number];
export const DEFAULT_STAKE: Stake = 25;

export function isStake(value: unknown): value is Stake {
  return typeof value === "number" && (STAKE_OPTIONS as readonly number[]).includes(value);
}

export function resolveStake(chips: number, stake: Stake, correct: boolean): number {
  if (correct) {
    return chips + stake;
  }
  return Math.max(0, chips - stake);
}
