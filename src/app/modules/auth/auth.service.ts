import { Role } from '@prisma/client';
import config from '../../config';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../shared/prisma';
import {
  ILoginResponse,
  ILoginUser,
  IRefreshTokenResponse,
  IRegisterUser,
} from './auth.interface';
import {
  createToken,
  generateSlug,
  hashPassword,
  isPasswordMatched,
  verifyToken,
} from './auth.utils';

const register = async (payload: IRegisterUser) => {
  const isUserExist = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExist) {
    throw new AppError(409, 'User with this email already exists');
  }

  const hashedPassword = await hashPassword(payload.password);

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: payload.email,
        fullName: payload.fullName,
        passwordHash: hashedPassword,
        role: payload.role,
      },
    });

    let company = null;
    if (payload.role === Role.RECRUITER) {
      const companyName =
        payload.companyName?.trim() || `${payload.fullName}'s Organization`;
      company = await tx.company.create({
        data: {
          ownerId: newUser.id,
          name: companyName,
          slug: generateSlug(companyName),
          assessmentCredits: 5,
          planTier: 'FREE',
        },
      });
    }

    return {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      companyId: company?.id || null,
      createdAt: newUser.createdAt,
    };
  });

  return result;
};

const login = async (payload: ILoginUser): Promise<ILoginResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { company: true },
  });

  if (!user || user.deletedAt) {
    throw new AppError(404, 'User does not exist');
  }

  if (!user.isActive) {
    throw new AppError(403, 'User account is deactivated');
  }

  if (!user.passwordHash) {
    throw new AppError(
      400,
      'This account was registered with Google Social Login. Please login via Google.',
    );
  }

  const isPasswordValid = await isPasswordMatched(
    payload.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid password');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt.accessSecret as string,
    config.jwt.accessExpiresIn as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt.refreshSecret as string,
    config.jwt.refreshExpiresIn as string,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      companyId: user.company?.id || null,
    },
  };
};

const refreshToken = async (token: string): Promise<IRefreshTokenResponse> => {
  if (!token) {
    throw new AppError(401, 'Refresh token is required');
  }

  let verifiedToken;
  try {
    verifiedToken = verifyToken(token, config.jwt.refreshSecret as string);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: verifiedToken.userId },
  });

  if (!user || user.deletedAt || !user.isActive) {
    throw new AppError(404, 'User does not exist or is inactive');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt.accessSecret as string,
    config.jwt.accessExpiresIn as string,
  );

  return {
    accessToken,
  };
};

export const AuthService = {
  register,
  login,
  refreshToken,
};
