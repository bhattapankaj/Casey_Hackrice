import type { VoiceEnvironment } from "@/lib/voice/types";

const TOKEN_ENDPOINT = "https://api.elevenlabs.io/v1/convai/conversation/token";

export type ProviderToken = {
  token: string;
  conversationId: string;
};

export class VoiceProviderError extends Error {
  constructor(
    public readonly kind: "timeout" | "unavailable",
    public readonly providerStatusClass?: string,
  ) {
    super(kind === "timeout" ? "Provider request timed out" : "Provider request failed");
    this.name = "VoiceProviderError";
  }
}

export type ProviderFetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function statusClass(status: number): string {
  return `${Math.floor(status / 100)}xx`;
}

export async function requestConversationToken(
  environment: VoiceEnvironment,
  options: {
    fetcher?: ProviderFetcher;
    timeoutMs?: number;
  } = {},
): Promise<ProviderToken> {
  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 5_000);
  const url = new URL(TOKEN_ENDPOINT);
  url.searchParams.set("agent_id", environment.agentId);

  try {
    const response = await fetcher(url, {
      method: "GET",
      headers: { "xi-api-key": environment.apiKey },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new VoiceProviderError("unavailable", statusClass(response.status));
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new VoiceProviderError("unavailable", statusClass(response.status));
    }
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).token !== "string" ||
      (body as Record<string, unknown>).token === "" ||
      (body as Record<string, string>).token.trim() === "" ||
      typeof (body as Record<string, unknown>).conversation_id !== "string" ||
      (body as Record<string, unknown>).conversation_id === "" ||
      (body as Record<string, string>).conversation_id.trim() === ""
    ) {
      throw new VoiceProviderError("unavailable", statusClass(response.status));
    }
    return {
      token: (body as Record<string, string>).token,
      conversationId: (body as Record<string, string>).conversation_id,
    };
  } catch (error) {
    if (error instanceof VoiceProviderError) {
      throw error;
    }
    if (controller.signal.aborted) {
      throw new VoiceProviderError("timeout");
    }
    throw new VoiceProviderError("unavailable");
  } finally {
    clearTimeout(timer);
  }
}
