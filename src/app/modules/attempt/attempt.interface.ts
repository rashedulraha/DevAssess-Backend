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
