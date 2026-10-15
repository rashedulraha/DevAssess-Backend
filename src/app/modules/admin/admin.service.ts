import { Prisma, Role } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { IAuthUser } from '../../interfaces';
import { logAudit } from '../../shared/auditLogger';
import { calculatePagination } from '../../shared/paginationHelper';
import { prisma } from '../../shared/prisma';
import { redis } from '../../shared/redis';
import { userSearchableFields } from './admin.constant';
import {
  IAuditLogFilterRequest,
  IPaginationOptions,
  IUpdateUserRolePayload,
  IUserFilterRequest,
} from './admin.interface';

const getAllUsers = async (
  filters: IUserFilterRequest,
  paginationOptions: IPaginationOptions,
) => {
  const { searchTerm, isActive, ...filterData } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const andConditions: Prisma.UserWhereInput[] = [{ deletedAt: null }];

  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (isActive !== undefined) {
    const isActiveBool = isActive === 'true' || isActive === true;
    andConditions.push({ isActive: isActiveBool });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as Record<string, unknown>)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const total = await prisma.user.count({ where: whereConditions });
  const users = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          assessmentCredits: true,
          planTier: true,
        },
      },
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: users,
  };
};

const updateUserRole = async (
  id: string,
  adminUser: IAuthUser,
  payload: IUpdateUserRolePayload,
) => {
  const targetUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!targetUser || targetUser.deletedAt) {
    throw new AppError(404, 'User not found.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        ...(payload.role && { role: payload.role }),
        ...(payload.isActive !== undefined && { isActive: payload.isActive }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await logAudit({
      actorId: adminUser.userId,
      action: 'USER_ROLE_UPDATED',
      entityType: 'User',
      entityId: id,
      oldValue: { role: targetUser.role, isActive: targetUser.isActive },
      newValue: { role: updatedUser.role, isActive: updatedUser.isActive },
      tx,
    });

    return updatedUser;
  });

  return result;
};

const getDashboardStats = async () => {
  const cacheKey = 'admin:dashboard-stats';
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore Redis read error
  }

  const roleCounts = await prisma.user.groupBy({
    by: ['role'],
    where: { deletedAt: null },
    _count: { id: true },
  });

  const userDistribution: Record<string, number> = {
    CANDIDATE: 0,
    RECRUITER: 0,
    ADMIN: 0,
  };
  for (const item of roleCounts) {
    userDistribution[item.role] = item._count.id;
  }

  const revenueAgg = await prisma.payment.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { amount: true },
    _count: { id: true },
  });

  const activeAssessments = await prisma.assessment.count({
    where: { status: 'PUBLISHED', deletedAt: null },
  });

  const totalAttempts = await prisma.assessmentAttempt.count();
  const completedAttempts = await prisma.assessmentAttempt.count({
    where: { status: { in: ['SUBMITTED', 'EVALUATED', 'FLAGGED'] } },
  });
  const passedAttempts = await prisma.assessmentAttempt.count({
    where: { isPassed: true },
  });

  const passRate =
    completedAttempts > 0 ? Math.round((passedAttempts / completedAttempts) * 10000) / 100 : 0;

  const stats = {
    overview: {
      totalRevenue: revenueAgg._sum.amount || 0,
      totalCompletedTransactions: revenueAgg._count.id || 0,
      activeAssessments,
      totalAttempts,
      completedAttempts,
      passedAttempts,
      passRate,
    },
    userDistribution,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 300);
  } catch {
    // Ignore Redis write error
  }

  return stats;
};

const getAuditLogs = async (
  filters: IAuditLogFilterRequest,
  paginationOptions: IPaginationOptions,
) => {
  const { action, entityType, actorId } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const andConditions: Prisma.AuditLogWhereInput[] = [];

  if (action) {
    andConditions.push({ action });
  }
  if (entityType) {
    andConditions.push({ entityType });
  }
  if (actorId) {
    andConditions.push({ actorId });
  }

  const whereConditions: Prisma.AuditLogWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const total = await prisma.auditLog.count({ where: whereConditions });
  const logs = await prisma.auditLog.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: logs,
  };
};

export const AdminService = {
  getAllUsers,
  updateUserRole,
  getDashboardStats,
  getAuditLogs,
};
