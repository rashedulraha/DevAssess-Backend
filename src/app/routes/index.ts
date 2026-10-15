import { Router } from 'express';
import { AssessmentRoutes } from '../modules/assessment/assessment.route';
import { AuthRoutes } from '../modules/auth/auth.route';
import { CompanyRoutes } from '../modules/company/company.route';
import { ProblemRoutes } from '../modules/problem/problem.route';
import { UserRoutes } from '../modules/user/user.route';
import { AttemptRoutes } from '../modules/attempt/attempt.route';
import { InvitationRoutes } from '../modules/invitation/invitation.route';
import { PaymentRoutes } from '../modules/payment/payment.route';
import { SubmissionRoutes } from '../modules/submission/submission.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/companies',
    route: CompanyRoutes,
  },
  {
    path: '/problems',
    route: ProblemRoutes,
  },
  {
    path: '/assessments',
    route: AssessmentRoutes,
  },
  {
    path: '/invitations',
    route: InvitationRoutes,
  },
  {
    path: '/attempts',
    route: AttemptRoutes,
  },
  {
    path: '/submissions',
    route: SubmissionRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
