import { Role } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { AttemptController } from './attempt.controller';
import { AttemptValidation } from './attempt.validation';

const router = Router();

router.post(
  '/start',
  auth(Role.CANDIDATE),
  validateRequest(AttemptValidation.startAttemptValidationSchema),
  AttemptController.startAttempt,
);

export const AttemptRoutes = router;
