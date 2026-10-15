import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.route';
import { CompanyRoutes } from '../modules/company/company.route';
import { ProblemRoutes } from '../modules/problem/problem.route';
import { UserRoutes } from '../modules/user/user.route';

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
