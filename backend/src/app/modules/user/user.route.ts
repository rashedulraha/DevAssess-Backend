import { Role } from '@prisma/client';
import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';
import { validateRequest } from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = Router();

// Middleware to parse multipart stringified data if sent via form-data
const parseMultipartJson = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body?.data && typeof req.body.data === 'string') {
    try {
      req.body = JSON.parse(req.body.data);
    } catch {
      // Continue with raw body if JSON.parse fails
    }
  }
  next();
};

router.get(
  '/me',
  auth(Role.CANDIDATE, Role.RECRUITER, Role.ADMIN),
  UserController.getMyProfile,
);

router.patch(
  '/me',
  auth(Role.CANDIDATE, Role.RECRUITER, Role.ADMIN),
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
  ]),
  parseMultipartJson,
  validateRequest(UserValidation.updateProfileValidationSchema),
  UserController.updateMyProfile,
);

export const UserRoutes = router;
