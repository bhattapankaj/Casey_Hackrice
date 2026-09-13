import { createMoriartyChallengeResponse } from "@/lib/gemini/create-challenge.server";
import { getGeminiEnvironment } from "@/lib/gemini/env.server";
import { generateGeminiMoriartyCopy } from "@/lib/gemini/provider.server";
import { createLocalRateLimiter } from "@/lib/voice/rate-limit.server";

export const dynamic = "force-dynamic";

const limiter = createLocalRateLimiter({ limit: 6, windowMs: 60_000 });

export async function POST(request: Request): Promise<Response> {
  return createMoriartyChallengeResponse(request, {
    getEnvironment: getGeminiEnvironment,
    generate: generateGeminiMoriartyCopy,
    limiter,
  });
}
