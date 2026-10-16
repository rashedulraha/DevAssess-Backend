import { z } from 'zod';

const inviteCandidatesValidationSchema = z.object({
  body: z.object({
    emails: z
      .array(z.string().email('Invalid email address format'))
      .min(1, 'At least one candidate email is required'),
    expiresInDays: z
      .number()
      .int()
      .positive('Expiration days must be a positive integer')
      .max(30, 'Expiration days cannot exceed 30 days')
      .optional()
      .default(7),
  }),
});

export const InvitationValidation = {
  inviteCandidatesValidationSchema,
};
