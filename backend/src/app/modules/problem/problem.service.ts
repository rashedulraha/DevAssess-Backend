import { Prisma, Role } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { IAuthUser } from '../../interfaces';
import { calculatePagination } from '../../shared/paginationHelper';
import { prisma } from '../../shared/prisma';
import { problemSearchableFields } from './problem.constant';
import {
  ICreateProblemPayload,
  IPaginationOptions,
  IProblemFilterRequest,
  IProblemSearchQuery,
  IUpdateProblemPayload,
} from './problem.interface';

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

const getAllProblems = async (
  filters: IProblemFilterRequest,
  paginationOptions: IPaginationOptions,
  user: IAuthUser,
) => {
  const { searchTerm, tag, ...filterData } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const andConditions: Prisma.ProblemWhereInput[] = [
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
      OR: problemSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (tag) {
    andConditions.push({
      tags: {
        has: tag,
      },
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

  const whereConditions: Prisma.ProblemWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const total = await prisma.problem.count({ where: whereConditions });
  const result = await prisma.problem.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
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

const searchProblems = async (
  query: IProblemSearchQuery,
  paginationOptions: IPaginationOptions,
  user: IAuthUser,
) => {
  const { q, tag } = query;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const andConditions: Prisma.ProblemWhereInput[] = [
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

  if (q) {
    andConditions.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (tag) {
    andConditions.push({
      tags: {
        has: tag,
      },
    });
  }

  const whereConditions: Prisma.ProblemWhereInput = { AND: andConditions };

  const total = await prisma.problem.count({ where: whereConditions });
  const result = await prisma.problem.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
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
  getAllProblems,
  searchProblems,
  getSingleProblem,
  updateProblem,
  deleteProblem,
};
