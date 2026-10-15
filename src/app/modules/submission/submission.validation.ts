import { z } from 'zod';

const evaluateSubmissionValidationSchema = z.object({
  body: z.object({
    awardedScore: z
      .number()
      .min(0, 'Awarded score cannot be negative'),
    evaluatorNotes: z.string().optional(),
  }),
});

export const SubmissionValidation = {
  evaluateSubmissionValidationSchema,
};
