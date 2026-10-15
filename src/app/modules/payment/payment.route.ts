import { Role } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { PaymentController } from './payment.controller';
import { PaymentValidation } from './payment.validation';

const router = Router();

router.post(
  '/initiate',
  auth(Role.RECRUITER),
  validateRequest(PaymentValidation.initiatePaymentValidationSchema),
  PaymentController.initiatePayment,
);

router.post(
  '/webhook',
  PaymentController.handleWebhook,
);

router.post(
  '/ssl-success',
  PaymentController.handleSslSuccess,
);

router.get(
  '/ssl-success',
  PaymentController.handleSslSuccess,
);

router.get(
  '/test-checkout',
  PaymentController.simulateTestCheckout,
);

router.get(
  '/my',
  auth(Role.RECRUITER),
  PaymentController.getMyPayments,
);

router.get(
  '/:id',
  auth(Role.RECRUITER, Role.ADMIN),
  PaymentController.getPaymentById,
);

export const PaymentRoutes = router;
