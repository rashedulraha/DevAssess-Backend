import { Role } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ProblemController } from './problem.controller';
import { ProblemValidation } from './problem.validation';

const router = Router();

router.post(
  '/',
  auth(Role.RECRUITER),
  validateRequest(ProblemValidation.createProblemValidationSchema),
  ProblemController.createProblem,
);

router.get(
  '/',
  auth(Role.RECRUITER, Role.ADMIN),
  ProblemController.getAllProblems,
);

router.get(
  '/search',
  auth(Role.RECRUITER, Role.ADMIN),
  ProblemController.searchProblems,
);

router.get(
  '/:id',
  auth(Role.RECRUITER, Role.ADMIN),
  ProblemController.getSingleProblem,
);

router.patch(
  '/:id',
  auth(Role.RECRUITER, Role.ADMIN),
  validateRequest(ProblemValidation.updateProblemValidationSchema),
  ProblemController.updateProblem,
);

router.delete(
  '/:id',
  auth(Role.RECRUITER, Role.ADMIN),
  ProblemController.deleteProblem,
);

export const ProblemRoutes = router;
