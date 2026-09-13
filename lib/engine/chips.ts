export const STARTING_CHIPS = 100;
export const STAKE_OPTIONS = [10, 25, 50] as const;
export type Stake = (typeof STAKE_OPTIONS)[number];
export const DEFAULT_STAKE: Stake = 25;
export const TABLE_RESERVE_CHIPS = 10;

export function isStake(value: unknown): value is Stake {
  return typeof value === "number" && (STAKE_OPTIONS as readonly number[]).includes(value);
}

export function canAffordStake(chips: number, stake: Stake): boolean {
  return Number.isFinite(chips) && Math.max(0, Math.floor(chips)) >= stake;
}

export function defaultStakeForChips(chips: number): Stake {
  return canAffordStake(chips, DEFAULT_STAKE) ? DEFAULT_STAKE : TABLE_RESERVE_CHIPS;
}

export function resolveStake(chips: number, stake: Stake, correct: boolean): number {
  const bankroll = Math.max(0, Math.floor(Number.isFinite(chips) ? chips : 0));
  const wager = Math.min(bankroll, stake);
  if (correct) {
    return bankroll + wager;
  }
  return bankroll - wager;
}
