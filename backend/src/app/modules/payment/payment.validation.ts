import { z } from 'zod';

const initiatePaymentValidationSchema = z.object({
  body: z.object({
    bundle: z.enum(['STARTER_25', 'PRO_100', 'ENTERPRISE_300'], {
      message: 'Bundle must be one of: STARTER_25, PRO_100, ENTERPRISE_300',
    }),
    provider: z.enum(['STRIPE', 'SSLCOMMERZ']).optional().default('STRIPE'),
  }),
});

export const PaymentValidation = {
  initiatePaymentValidationSchema,
};
