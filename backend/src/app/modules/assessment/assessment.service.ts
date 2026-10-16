import { AssessmentStatus, Prisma, Role } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { IAuthUser } from '../../interfaces';
import { calculatePagination } from '../../shared/paginationHelper';
import { prisma } from '../../shared/prisma';
import { redis } from '../../shared/redis';
import { assessmentSearchableFields } from './assessment.constant';
import {
  IAssessmentFilterRequest,
  ICreateAssessmentPayload,
  IPaginationOptions,
  IUpdateAssessmentPayload,
} from './assessment.interface';

const createAssessment = async (
  user: IAuthUser,
  payload: ICreateAssessmentPayload,
) => {
  const company = await prisma.company.findUnique({
    where: { ownerId: user.userId },
  });

  if (!company) {
    throw new AppError(400, 'Company profile is required before creating an assessment.');
  }

  const result = await prisma.$transaction(async (tx) => {
    let totalPoints = 0;

    if (payload.problems && payload.problems.length > 0) {
      const problemIds = payload.problems.map((p) => p.problemId);
      const problemsInDb = await tx.problem.findMany({
        where: {
          id: { in: problemIds },
          deletedAt: null,
        },
      });

      for (const pInput of payload.problems) {
        const found = problemsInDb.find((dbP) => dbP.id === pInput.problemId);
        if (!found) {
          throw new AppError(404, `Problem with ID ${pInput.problemId} was not found or is deleted.`);
        }
        totalPoints += pInput.customPoints ?? found.maxScore;
      }
    }

    const assessment = await tx.assessment.create({
      data: {
        companyId: company.id,
        title: payload.title,
        description: payload.description,
        durationMinutes: payload.durationMinutes ?? 60,
        passingScore: payload.passingScore ?? 70,
        totalPoints,
        maxTabSwitches: payload.maxTabSwitches ?? 3,
        startAt: payload.startAt ? new Date(payload.startAt) : null,
        endAt: payload.endAt ? new Date(payload.endAt) : null,
      },
    });

    if (payload.problems && payload.problems.length > 0) {
      await tx.assessmentProblem.createMany({
        data: payload.problems.map((p, idx) => ({
          assessmentId: assessment.id,
          problemId: p.problemId,
          orderIndex: p.orderIndex ?? idx + 1,
          customPoints: p.customPoints ?? null,
        })),
      });
    }

    const createdAssessment = await tx.assessment.findUnique({
      where: { id: assessment.id },
      include: {
        problems: {
          orderBy: { orderIndex: 'asc' },
          include: {
            problem: true,
          },
        },
      },
    });

    return createdAssessment;
  });

  return result;
};

const getAllAssessments = async (
  filters: IAssessmentFilterRequest,
  paginationOptions: IPaginationOptions,
  user: IAuthUser,
) => {
  const { searchTerm, ...filterData } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const andConditions: Prisma.AssessmentWhereInput[] = [
    { deletedAt: null },
  ];

  if (user.role === Role.RECRUITER) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.userId },
    });
    if (!company) {
      throw new AppError(400, 'Company profile is required for recruiters.');
    }
    andConditions.push({ companyId: company.id });
  }

  if (searchTerm) {
    andConditions.push({
      OR: assessmentSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
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

  const whereConditions: Prisma.AssessmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const total = await prisma.assessment.count({ where: whereConditions });
  const result = await prisma.assessment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      _count: {
        select: {
          problems: true,
          invitations: true,
          attempts: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: result,
  };
};

const getSingleAssessment = async (id: string, user: IAuthUser) => {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },
      problems: {
        orderBy: { orderIndex: 'asc' },
        include: {
          problem: true,
        },
      },
      _count: {
        select: {
          invitations: true,
          attempts: true,
        },
      },
    },
  });

  if (!assessment) {
    throw new AppError(404, 'Assessment not found.');
  }

  if (user.role === Role.RECRUITER) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.userId },
    });
    if (!company || assessment.companyId !== company.id) {
      throw new AppError(403, 'Forbidden: You do not have permission to view this assessment.');
    }
  }

  return assessment;
};

const updateAssessment = async (
  id: string,
  user: IAuthUser,
  payload: IUpdateAssessmentPayload,
) => {
  const existingAssessment = await prisma.assessment.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!existingAssessment) {
    throw new AppError(404, 'Assessment not found.');
  }

  if (user.role === Role.RECRUITER) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.userId },
    });
    if (!company || existingAssessment.companyId !== company.id) {
      throw new AppError(403, 'Forbidden: You can only update assessments belonging to your company.');
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    let totalPoints = existingAssessment.totalPoints;

    if (payload.problems !== undefined) {
      const problemIds = payload.problems.map((p) => p.problemId);
      const problemsInDb = await tx.problem.findMany({
        where: {
          id: { in: problemIds },
          deletedAt: null,
        },
      });

      totalPoints = 0;
      for (const pInput of payload.problems) {
        const found = problemsInDb.find((dbP) => dbP.id === pInput.problemId);
        if (!found) {
          throw new AppError(404, `Problem with ID ${pInput.problemId} was not found or is deleted.`);
        }
        totalPoints += pInput.customPoints ?? found.maxScore;
      }

      await tx.assessmentProblem.deleteMany({
        where: { assessmentId: id },
      });

      if (payload.problems.length > 0) {
        await tx.assessmentProblem.createMany({
          data: payload.problems.map((p, idx) => ({
            assessmentId: id,
            problemId: p.problemId,
            orderIndex: p.orderIndex ?? idx + 1,
            customPoints: p.customPoints ?? null,
          })),
        });
      }
    }

    const updated = await tx.assessment.update({
      where: { id },
      data: {
        ...(payload.title && { title: payload.title }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.durationMinutes !== undefined && { durationMinutes: payload.durationMinutes }),
        ...(payload.passingScore !== undefined && { passingScore: payload.passingScore }),
        ...(payload.maxTabSwitches !== undefined && { maxTabSwitches: payload.maxTabSwitches }),
        ...(payload.startAt !== undefined && {
          startAt: payload.startAt ? new Date(payload.startAt) : null,
        }),
        ...(payload.endAt !== undefined && {
          endAt: payload.endAt ? new Date(payload.endAt) : null,
        }),
        totalPoints,
      },
      include: {
        problems: {
          orderBy: { orderIndex: 'asc' },
          include: {
            problem: true,
          },
        },
      },
    });

    return updated;
  });

  return result;
};

const updateAssessmentStatus = async (
  id: string,
  user: IAuthUser,
  status: AssessmentStatus,
) => {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(404, 'Assessment not found.');
  }

  if (user.role === Role.RECRUITER) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.userId },
    });
    if (!company || assessment.companyId !== company.id) {
      throw new AppError(403, 'Forbidden: You can only update assessments belonging to your company.');
    }
  }

  if (status === AssessmentStatus.PUBLISHED) {
    const problemCount = await prisma.assessmentProblem.count({
      where: { assessmentId: id },
    });

    if (problemCount === 0) {
      throw new AppError(
        400,
        'Cannot publish assessment: at least one problem must be attached before publishing.',
      );
    }
  }

  const updatedAssessment = await prisma.assessment.update({
    where: { id },
    data: { status },
  });

  return updatedAssessment;
};

const deleteAssessment = async (id: string, user: IAuthUser) => {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(404, 'Assessment not found.');
  }

  if (user.role === Role.RECRUITER) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.userId },
    });
    if (!company || assessment.companyId !== company.id) {
      throw new AppError(403, 'Forbidden: You can only delete assessments belonging to your company.');
    }
  }

  const deletedAssessment = await prisma.assessment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return deletedAssessment;
};

const getAssessmentReport = async (id: string, user: IAuthUser) => {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      company: true,
    },
  });

  if (!assessment) {
    throw new AppError(404, 'Assessment not found.');
  }

  if (user.role === Role.RECRUITER) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.userId },
    });
    if (!company || assessment.companyId !== company.id) {
      throw new AppError(403, 'Forbidden: You do not have permission to view this report.');
    }
  }

  const cacheKey = `report:assessment:${id}`;
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (err) {
    // Ignore Redis read error
  }

  const totalInvited = await prisma.candidateInvitation.count({
    where: { assessmentId: id },
  });

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { assessmentId: id },
    include: {
      candidate: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
      antiCheatLogs: true,
    },
    orderBy: { totalScore: 'desc' },
  });

  const completedAttempts = attempts.filter((a) =>
    ['SUBMITTED', 'EVALUATED', 'FLAGGED'].includes(a.status),
  );
  const passedAttempts = completedAttempts.filter((a) => a.isPassed);

  const totalScoreSum = completedAttempts.reduce((acc, a) => acc + a.percentageScore, 0);
  const averageScore =
    completedAttempts.length > 0
      ? Math.round((totalScoreSum / completedAttempts.length) * 100) / 100
      : 0;

  const passRate =
    completedAttempts.length > 0
      ? Math.round((passedAttempts.length / completedAttempts.length) * 10000) / 100
      : 0;

  const scores = completedAttempts.map((a) => a.totalScore);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  const flaggedAttempts = attempts.filter((a) => a.status === 'FLAGGED');
  const allLogs = attempts.flatMap((a) => a.antiCheatLogs);
  const eventBreakdown: Record<string, number> = {};
  for (const log of allLogs) {
    eventBreakdown[log.eventType] = (eventBreakdown[log.eventType] || 0) + 1;
  }

  const leaderboard = attempts.map((a, index) => ({
    rank: index + 1,
    attemptId: a.id,
    candidate: a.candidate,
    status: a.status,
    totalScore: a.totalScore,
    percentageScore: a.percentageScore,
    isPassed: a.isPassed,
    tabSwitchCount: a.tabSwitchCount,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
  }));

  const report = {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      durationMinutes: assessment.durationMinutes,
      totalPoints: assessment.totalPoints,
      passingScore: assessment.passingScore,
      status: assessment.status,
    },
    metrics: {
      totalInvited,
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      passedAttempts: passedAttempts.length,
      passRate,
      averageScore,
      highestScore,
      lowestScore,
    },
    antiCheatSummary: {
      totalFlaggedAttempts: flaggedAttempts.length,
      totalViolations: allLogs.length,
      eventBreakdown,
    },
    leaderboard,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(report), 'EX', 300);
  } catch (err) {
    // Ignore Redis write error
  }

  return report;
};

export const AssessmentService = {
  createAssessment,
  getAllAssessments,
  getSingleAssessment,
  updateAssessment,
  updateAssessmentStatus,
  deleteAssessment,
  getAssessmentReport,
};
