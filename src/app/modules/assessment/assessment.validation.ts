import { AssessmentStatus } from '@prisma/client';
import { z } from 'zod';

const assessmentProblemSchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  orderIndex: z.number().int().positive().optional(),
  customPoints: z.number().int().positive().optional(),
});

const createAssessmentValidationSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Assessment title must be at least 3 characters')
      .max(200, 'Assessment title cannot exceed 200 characters'),
    description: z.string().optional(),
    durationMinutes: z
      .number()
      .int()
      .min(15, 'Duration must be at least 15 minutes')
      .max(300, 'Duration cannot exceed 300 minutes')
      .optional()
      .default(60),
    passingScore: z
      .number()
      .int()
      .min(0, 'Passing score must be at least 0')
      .optional()
      .default(70),
    maxTabSwitches: z
      .number()
      .int()
      .min(1, 'Max tab switches must be at least 1')
      .max(20, 'Max tab switches cannot exceed 20')
      .optional()
      .default(3),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    problems: z.array(assessmentProblemSchema).optional(),
  }),
});

const updateAssessmentValidationSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Assessment title must be at least 3 characters')
      .max(200, 'Assessment title cannot exceed 200 characters')
      .optional(),
    description: z.string().optional(),
    durationMinutes: z
      .number()
      .int()
      .min(15, 'Duration must be at least 15 minutes')
      .max(300, 'Duration cannot exceed 300 minutes')
      .optional(),
    passingScore: z
      .number()
      .int()
      .min(0, 'Passing score must be at least 0')
      .optional(),
    maxTabSwitches: z
      .number()
      .int()
      .min(1, 'Max tab switches must be at least 1')
      .max(20, 'Max tab switches cannot exceed 20')
      .optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    problems: z.array(assessmentProblemSchema).optional(),
  }),
});

const updateAssessmentStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum([
      AssessmentStatus.DRAFT,
      AssessmentStatus.PUBLISHED,
      AssessmentStatus.CLOSED,
      AssessmentStatus.ARCHIVED,
    ], {
      message: 'Invalid assessment status value',
    }),
  }),
});

export const AssessmentValidation = {
  createAssessmentValidationSchema,
  updateAssessmentValidationSchema,
  updateAssessmentStatusValidationSchema,
};
