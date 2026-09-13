import "server-only";
import type { VoiceEnvironment } from "@/lib/voice/types";

export function getVoiceEnvironment(): VoiceEnvironment | null {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const agentId = process.env.ELEVENLABS_AGENT_ID?.trim();
  if (!apiKey || !agentId) {
    return null;
  }
  return { apiKey, agentId };
}
