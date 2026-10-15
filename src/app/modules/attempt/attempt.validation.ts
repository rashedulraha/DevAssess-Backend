import { z } from 'zod';

const startAttemptValidationSchema = z.object({
  body: z.object({
    inviteToken: z
      .string()
      .min(10, 'Invite token is required and must be valid'),
  }),
});

const submitProblemValidationSchema = z.object({
  body: z.object({
    problemId: z.string().min(1, 'Problem ID is required'),
    selectedOption: z.string().optional(),
    writtenAnswer: z.string().optional(),
    sourceCode: z.string().optional(),
    language: z.string().optional(),
  }),
});

export const AttemptValidation = {
  startAttemptValidationSchema,
  submitProblemValidationSchema,
};
