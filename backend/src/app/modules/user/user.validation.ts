import { z } from 'zod';

const updateProfileValidationSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
    bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
    avatarUrl: z.string().url('Invalid avatar URL format').optional(),
    resumeUrl: z.string().url('Invalid resume URL format').optional(),
  }),
});

export const UserValidation = {
  updateProfileValidationSchema,
};
