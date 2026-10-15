import { Role } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { SubmissionController } from './submission.controller';
import { SubmissionValidation } from './submission.validation';

const router = Router();

router.patch(
  '/:id/evaluate',
  auth(Role.RECRUITER, Role.ADMIN),
  validateRequest(SubmissionValidation.evaluateSubmissionValidationSchema),
  SubmissionController.evaluateSubmission,
);

export const SubmissionRoutes = router;
