export interface IStartAttemptPayload {
  inviteToken: string;
}

export interface ISubmitProblemPayload {
  problemId: string;
  selectedOption?: string;
  writtenAnswer?: string;
  sourceCode?: string;
  language?: string;
}

export interface IAntiCheatEventPayload {
  eventType: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'COPY_PASTE';
  metadata?: Record<string, unknown>;
}
