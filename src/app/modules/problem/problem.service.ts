import { Role } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { IAuthUser } from '../../interfaces';
import { prisma } from '../../shared/prisma';
import { ICreateProblemPayload, IUpdateProblemPayload } from './problem.interface';

const createProblem = async (user: IAuthUser, payload: ICreateProblemPayload) => {
  const company = await prisma.company.findUnique({
    where: { ownerId: user.userId },
  });

  if (!company) {
    throw new AppError(400, 'Company profile is required before adding problems to the problem bank.');
  }

  const problem = await prisma.problem.create({
    data: {
      companyId: company.id,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      difficulty: payload.difficulty,
      tags: payload.tags,
      options: payload.options ? JSON.parse(JSON.stringify(payload.options)) : undefined,
      starterCode: payload.starterCode ? JSON.parse(JSON.stringify(payload.starterCode)) : undefined,
      testCases: payload.testCases ? JSON.parse(JSON.stringify(payload.testCases)) : undefined,
      maxScore: payload.maxScore || 10,
    },
  });

  return problem;
};

const getSingleProblem = async (id: string, user: IAuthUser) => {
  const problem = await prisma.problem.findFirst({
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
    },
  });

  if (!problem) {
    throw new AppError(404, 'Problem not found');
  }

  if (user.role === Role.RECRUITER) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.userId },
    });

    if (!company || problem.companyId !== company.id) {
      throw new AppError(403, 'Forbidden: You do not have permission to view this problem');
    }
  }

  return problem;
};

const updateProblem = async (
  id: string,
  user: IAuthUser,
  payload: IUpdateProblemPayload,
) => {
  const problem = await prisma.problem.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!problem) {
    throw new AppError(404, 'Problem not found');
  }

  if (user.role === Role.RECRUITER) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.userId },
    });

    if (!company || problem.companyId !== company.id) {
      throw new AppError(403, 'Forbidden: You can only update problems belonging to your company');
    }
  }

  const updatedProblem = await prisma.problem.update({
    where: { id },
    data: {
      ...(payload.title && { title: payload.title }),
      ...(payload.description && { description: payload.description }),
      ...(payload.type && { type: payload.type }),
      ...(payload.difficulty && { difficulty: payload.difficulty }),
      ...(payload.tags && { tags: payload.tags }),
      ...(payload.options !== undefined && {
        options: JSON.parse(JSON.stringify(payload.options)),
      }),
      ...(payload.starterCode !== undefined && {
        starterCode: JSON.parse(JSON.stringify(payload.starterCode)),
      }),
      ...(payload.testCases !== undefined && {
        testCases: JSON.parse(JSON.stringify(payload.testCases)),
      }),
      ...(payload.maxScore !== undefined && { maxScore: payload.maxScore }),
    },
  });

  return updatedProblem;
};

const deleteProblem = async (id: string, user: IAuthUser) => {
  const problem = await prisma.problem.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!problem) {
    throw new AppError(404, 'Problem not found');
  }

  if (user.role === Role.RECRUITER) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.userId },
    });

    if (!company || problem.companyId !== company.id) {
      throw new AppError(403, 'Forbidden: You can only delete problems belonging to your company');
    }
  }

  const deletedProblem = await prisma.problem.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  return deletedProblem;
};

export const ProblemService = {
  createProblem,
  getSingleProblem,
  updateProblem,
  deleteProblem,
};
