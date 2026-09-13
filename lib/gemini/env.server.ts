import "server-only";
import type { GeminiEnvironment } from "@/lib/gemini/types";

const DEFAULT_MODEL = "gemini-3.8-flash";
const MODEL_NAME = /^[A-Za-z0-9._-]{1,80}$/;

type GeminiProcessEnvironment = {
  [key: string]: string | undefined;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
};

export function getGeminiEnvironment(
  environment: GeminiProcessEnvironment = process.env,
): GeminiEnvironment | null {
  const apiKey = environment.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = environment.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  if (!MODEL_NAME.test(model)) {
    throw new Error("GEMINI_MODEL contains unsupported characters");
  }

  return { apiKey, model };
}
