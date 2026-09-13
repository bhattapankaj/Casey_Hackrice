export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type RateLimiter = {
  consume(key: string, nowMs: number): RateLimitResult;
};

type Entry = { count: number; resetAt: number };

export function createLocalRateLimiter(options = { limit: 5, windowMs: 60_000 }): RateLimiter {
  const entries = new Map<string, Entry>();
  return {
    consume(key, nowMs) {
      const existing = entries.get(key);
      if (!existing || nowMs >= existing.resetAt) {
        entries.set(key, { count: 1, resetAt: nowMs + options.windowMs });
        return { allowed: true };
      }
      if (existing.count >= options.limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - nowMs) / 1000)),
        };
      }
      existing.count += 1;
      return { allowed: true };
    },
  };
}

// This is a bounded local defense, not a globally reliable serverless rate limit.
export const localVoiceRateLimiter = createLocalRateLimiter();
