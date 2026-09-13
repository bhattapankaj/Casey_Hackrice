import { createVoiceSessionResponse } from "@/lib/voice/create-session.server";
import { getVoiceEnvironment } from "@/lib/voice/env.server";
import { localVoiceRateLimiter } from "@/lib/voice/rate-limit.server";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return createVoiceSessionResponse(request, {
    getEnvironment: getVoiceEnvironment,
    limiter: localVoiceRateLimiter,
  });
}
