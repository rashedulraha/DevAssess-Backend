import { Role } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { AssessmentController } from './assessment.controller';
import { AssessmentValidation } from './assessment.validation';

const router = Router();

router.post(
  '/',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.createAssessmentValidationSchema),
  AssessmentController.createAssessment,
);

router.get(
  '/',
  auth(Role.RECRUITER, Role.ADMIN),
  AssessmentController.getAllAssessments,
);

router.get(
  '/:id',
  auth(Role.RECRUITER, Role.ADMIN),
  AssessmentController.getSingleAssessment,
);

router.patch(
  '/:id',
  auth(Role.RECRUITER, Role.ADMIN),
  validateRequest(AssessmentValidation.updateAssessmentValidationSchema),
  AssessmentController.updateAssessment,
);

router.patch(
  '/:id/status',
  auth(Role.RECRUITER, Role.ADMIN),
  validateRequest(AssessmentValidation.updateAssessmentStatusValidationSchema),
  AssessmentController.updateAssessmentStatus,
);

router.delete(
  '/:id',
  auth(Role.RECRUITER, Role.ADMIN),
  AssessmentController.deleteAssessment,
);

export const AssessmentRoutes = router;
