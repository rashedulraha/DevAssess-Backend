import { Role } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { AssessmentController } from './assessment.controller';
import { AssessmentValidation } from './assessment.validation';
import { InvitationController } from '../invitation/invitation.controller';
import { InvitationValidation } from '../invitation/invitation.validation';

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

router.post(
  '/:id/invite',
  auth(Role.RECRUITER),
  validateRequest(InvitationValidation.inviteCandidatesValidationSchema),
  InvitationController.inviteCandidates,
);

router.get(
  '/:id/invitations',
  auth(Role.RECRUITER),
  InvitationController.getAssessmentInvitations,
);

router.get(
  '/:id/report',
  auth(Role.RECRUITER, Role.ADMIN),
  AssessmentController.getAssessmentReport,
);

router.delete(
  '/:id',
  auth(Role.RECRUITER, Role.ADMIN),
  AssessmentController.deleteAssessment,
);

export const AssessmentRoutes = router;
