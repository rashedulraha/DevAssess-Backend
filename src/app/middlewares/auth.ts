import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { AppError } from '../errors/AppError';
import { verifyToken } from '../modules/auth/auth.utils';
import { prisma } from '../shared/prisma';

export const auth = (...requiredRoles: Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'You are not authorized! Bearer token is missing.');
      }

      const token = authHeader.split(' ')[1];

      let verifiedUser;
      try {
        verifiedUser = verifyToken(token, config.jwt.accessSecret as string);
      } catch {
        throw new AppError(401, 'Invalid or expired access token.');
      }

      const { userId, role } = verifiedUser;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.deletedAt) {
        throw new AppError(404, 'User account was not found.');
      }

      if (!user.isActive) {
        throw new AppError(403, 'User account is deactivated.');
      }

      if (requiredRoles.length && !requiredRoles.includes(role as Role)) {
        throw new AppError(403, 'Forbidden: You do not have permission to access this resource.');
      }

      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
