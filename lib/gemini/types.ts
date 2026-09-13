import type { MoriartyChallengePlan } from "@/lib/engine/moriarty";

export type GeminiEnvironment = {
  apiKey: string;
  model: string;
};

export type GeminiCopyGenerator = (
  plan: MoriartyChallengePlan,
  environment: GeminiEnvironment,
  timeoutMs?: number,
) => Promise<unknown>;
