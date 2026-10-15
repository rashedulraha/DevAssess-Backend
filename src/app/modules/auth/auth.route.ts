import { Router } from 'express';
import { authRateLimiter } from '../../middlewares/rateLimiter';
import { validateRequest } from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = Router();

// Rate limiter for auth endpoints
router.use(authRateLimiter);

router.post(
  '/register',
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.register,
);

router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login,
);

router.post(
  '/google',
  validateRequest(AuthValidation.googleLoginValidationSchema),
  AuthController.googleLogin,
);

router.post(
  '/refresh-token',
  validateRequest(AuthValidation.refreshTokenValidationSchema),
  AuthController.refreshToken,
);

export const AuthRoutes = router;
