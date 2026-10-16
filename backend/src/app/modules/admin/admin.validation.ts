import { Role } from '@prisma/client';
import { z } from 'zod';

const updateUserRoleValidationSchema = z.object({
  body: z.object({
    role: z.enum([Role.CANDIDATE, Role.RECRUITER, Role.ADMIN]).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const AdminValidation = {
  updateUserRoleValidationSchema,
};
