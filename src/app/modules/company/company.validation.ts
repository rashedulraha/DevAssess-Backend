import { z } from 'zod';

const createCompanyValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Company name must be at least 2 characters')
      .max(100, 'Company name cannot exceed 100 characters'),
    website: z.string().url('Invalid website URL format').optional(),
    industry: z.string().max(100, 'Industry cannot exceed 100 characters').optional(),
    logoUrl: z.string().url('Invalid logo URL format').optional(),
  }),
});

const updateCompanyValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Company name must be at least 2 characters')
      .max(100, 'Company name cannot exceed 100 characters')
      .optional(),
    website: z.string().url('Invalid website URL format').optional(),
    industry: z.string().max(100, 'Industry cannot exceed 100 characters').optional(),
    logoUrl: z.string().url('Invalid logo URL format').optional(),
  }),
});

export const CompanyValidation = {
  createCompanyValidationSchema,
  updateCompanyValidationSchema,
};
