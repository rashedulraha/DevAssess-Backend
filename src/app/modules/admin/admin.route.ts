import { Role } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { AdminController } from './admin.controller';
import { AdminValidation } from './admin.validation';

const router = Router();

router.use(auth(Role.ADMIN));

router.get(
  '/users',
  AdminController.getAllUsers,
);

router.patch(
  '/users/:id/role',
  validateRequest(AdminValidation.updateUserRoleValidationSchema),
  AdminController.updateUserRole,
);

router.get(
  '/dashboard-stats',
  AdminController.getDashboardStats,
);

router.get(
  '/audit-logs',
  AdminController.getAuditLogs,
);

export const AdminRoutes = router;
