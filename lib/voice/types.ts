export type VoiceDynamicVariables = {
  case_title: string;
  character_name: string;
  organization_name: string;
  persona: string;
  opening_line: string;
  scenario_summary: string;
  allowed_facts: string;
  contradiction: string;
  crack_line: string;
  allowed_tactics: string;
};

export type VoiceSessionSuccess = {
  conversationToken: string;
  conversationId: string;
  dynamicVariables: VoiceDynamicVariables;
};

export type VoiceErrorCode =
  | "INVALID_REQUEST"
  | "UNKNOWN_CASE"
  | "FORBIDDEN"
  | "VOICE_NOT_CONFIGURED"
  | "RATE_LIMITED"
  | "VOICE_UNAVAILABLE"
  | "VOICE_TIMEOUT";

export type VoiceErrorResponse = {
  error: {
    code: VoiceErrorCode;
    message: string;
    requestId: string;
  };
};

export type VoiceLogEvent = {
  requestId: string;
  caseId?: string;
  providerStatusClass?: string;
  elapsedMs: number;
  internalCode: VoiceErrorCode | "VOICE_SESSION_CREATED";
};

export type VoiceEnvironment = {
  apiKey: string;
  agentId: string;
};
