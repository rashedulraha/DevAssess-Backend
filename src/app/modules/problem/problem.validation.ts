import { Difficulty, ProblemType } from '@prisma/client';
import { z } from 'zod';

const mcqOptionSchema = z.object({
  id: z.string().min(1, 'Option ID is required'),
  text: z.string().min(1, 'Option text cannot be empty'),
  isCorrect: z.boolean(),
});

const codingTestCaseSchema = z.object({
  input: z.string().min(1, 'Test case input is required'),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  isHidden: z.boolean().optional().default(false),
});

const createProblemValidationSchema = z
  .object({
    body: z
      .object({
        title: z
          .string()
          .min(3, 'Title must be at least 3 characters')
          .max(200, 'Title cannot exceed 200 characters'),
        description: z
          .string()
          .min(10, 'Description must be at least 10 characters'),
        type: z.enum([ProblemType.MCQ, ProblemType.WRITTEN, ProblemType.CODING], {
          message: 'Invalid problem type',
        }),
        difficulty: z.enum([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD], {
          message: 'Invalid difficulty level',
        }),
        tags: z
          .array(z.string().min(1))
          .min(1, 'At least one tag is required'),
        options: z.array(mcqOptionSchema).optional(),
        starterCode: z.record(z.string(), z.string()).optional(),
        testCases: z.array(codingTestCaseSchema).optional(),
        maxScore: z
          .number()
          .int()
          .positive('Max score must be a positive integer')
          .optional()
          .default(10),
      })
      .superRefine((data, ctx) => {
        if (data.type === ProblemType.MCQ) {
          if (!data.options || data.options.length < 2) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'MCQ problems must have at least 2 options',
              path: ['options'],
            });
          } else {
            const hasCorrectOption = data.options.some((opt) => opt.isCorrect === true);
            if (!hasCorrectOption) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'At least one option must be marked as correct (isCorrect: true)',
                path: ['options'],
              });
            }
          }
        }

        if (data.type === ProblemType.CODING) {
          if (!data.testCases || data.testCases.length < 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'CODING problems must have at least 1 test case',
              path: ['testCases'],
            });
          }
        }
      }),
  });

const updateProblemValidationSchema = z
  .object({
    body: z
      .object({
        title: z
          .string()
          .min(3, 'Title must be at least 3 characters')
          .max(200, 'Title cannot exceed 200 characters')
          .optional(),
        description: z
          .string()
          .min(10, 'Description must be at least 10 characters')
          .optional(),
        type: z.enum([ProblemType.MCQ, ProblemType.WRITTEN, ProblemType.CODING]).optional(),
        difficulty: z.enum([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]).optional(),
        tags: z.array(z.string().min(1)).optional(),
        options: z.array(mcqOptionSchema).optional(),
        starterCode: z.record(z.string(), z.string()).optional(),
        testCases: z.array(codingTestCaseSchema).optional(),
        maxScore: z
          .number()
          .int()
          .positive('Max score must be a positive integer')
          .optional(),
      })
      .superRefine((data, ctx) => {
        if (data.type === ProblemType.MCQ && data.options) {
          if (data.options.length < 2) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'MCQ problems must have at least 2 options',
              path: ['options'],
            });
          }
          const hasCorrectOption = data.options.some((opt) => opt.isCorrect === true);
          if (!hasCorrectOption) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'At least one option must be marked as correct (isCorrect: true)',
              path: ['options'],
            });
          }
        }

        if (data.type === ProblemType.CODING && data.testCases) {
          if (data.testCases.length < 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'CODING problems must have at least 1 test case',
              path: ['testCases'],
            });
          }
        }
      }),
  });

export const ProblemValidation = {
  createProblemValidationSchema,
  updateProblemValidationSchema,
};
