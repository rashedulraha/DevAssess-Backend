import { z } from 'zod';

const startAttemptValidationSchema = z.object({
  body: z.object({
    inviteToken: z
      .string()
      .min(10, 'Invite token is required and must be valid'),
  }),
});

export const AttemptValidation = {
  startAttemptValidationSchema,
};
