import { AttemptStatus, InvitationStatus, Problem, ProblemType } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { IAuthUser } from '../../interfaces';
import { prisma } from '../../shared/prisma';
import { redis } from '../../shared/redis';
import { IStartAttemptPayload } from './attempt.interface';

const sanitizeProblemForCandidate = (
  problem: Problem,
  customPoints?: number | null,
) => {
  let sanitizedOptions = undefined;
  if (problem.type === ProblemType.MCQ && Array.isArray(problem.options)) {
    sanitizedOptions = (problem.options as Array<{ id: string; text: string; isCorrect?: boolean }>).map(
      (opt) => ({
        id: opt.id,
        text: opt.text,
      }),
    );
  }

  let sanitizedTestCases = undefined;
  if (problem.type === ProblemType.CODING && Array.isArray(problem.testCases)) {
    sanitizedTestCases = (
      problem.testCases as Array<{ input: string; expectedOutput: string; isHidden?: boolean }>
    )
      .filter((tc) => !tc.isHidden)
      .map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }));
  }

  return {
    id: problem.id,
    title: problem.title,
    description: problem.description,
    type: problem.type,
    difficulty: problem.difficulty,
    tags: problem.tags,
    points: customPoints ?? problem.maxScore,
    options: sanitizedOptions,
    starterCode: problem.starterCode,
    testCases: sanitizedTestCases,
  };
};

const startAttempt = async (
  user: IAuthUser,
  payload: IStartAttemptPayload,
  ipAddress?: string,
) => {
  const { inviteToken } = payload;

  const invitation = await prisma.candidateInvitation.findUnique({
    where: { inviteToken },
    include: {
      assessment: {
        include: {
          problems: {
            orderBy: { orderIndex: 'asc' },
            include: {
              problem: true,
            },
          },
        },
      },
      attempt: true,
    },
  });

  if (!invitation) {
    throw new AppError(404, 'Invalid invitation token.');
  }

  if (invitation.status === InvitationStatus.REVOKED) {
    throw new AppError(403, 'This invitation has been revoked by the recruiter.');
  }

  if (invitation.attempt) {
    const existingAttempt = invitation.attempt;

    if (existingAttempt.status === AttemptStatus.IN_PROGRESS) {
      if (new Date() > existingAttempt.expiresAt) {
        await prisma.assessmentAttempt.update({
          where: { id: existingAttempt.id },
          data: { status: AttemptStatus.TIMED_OUT },
        });
        throw new AppError(400, 'Assessment attempt time limit has expired.');
      }

      const sanitizedProblems = invitation.assessment.problems
        .filter((ap) => !ap.problem.deletedAt)
        .map((ap) => sanitizeProblemForCandidate(ap.problem, ap.customPoints));

      return {
        attempt: {
          id: existingAttempt.id,
          status: existingAttempt.status,
          startedAt: existingAttempt.startedAt,
          expiresAt: existingAttempt.expiresAt,
          tabSwitchCount: existingAttempt.tabSwitchCount,
          durationMinutes: invitation.assessment.durationMinutes,
          maxTabSwitches: invitation.assessment.maxTabSwitches,
        },
        assessment: {
          id: invitation.assessment.id,
          title: invitation.assessment.title,
          description: invitation.assessment.description,
          totalPoints: invitation.assessment.totalPoints,
          passingScore: invitation.assessment.passingScore,
          problems: sanitizedProblems,
        },
      };
    }

    throw new AppError(
      400,
      `This assessment attempt has already been ${existingAttempt.status.toLowerCase()}.`,
    );
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.candidateInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    throw new AppError(400, 'This assessment invitation link has expired.');
  }

  const durationMinutes = invitation.assessment.durationMinutes;
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

  const attempt = await prisma.$transaction(async (tx) => {
    const newAttempt = await tx.assessmentAttempt.create({
      data: {
        invitationId: invitation.id,
        assessmentId: invitation.assessment.id,
        candidateId: user.userId,
        status: AttemptStatus.IN_PROGRESS,
        startedAt,
        expiresAt,
        ipAddress: ipAddress || null,
      },
    });

    await tx.candidateInvitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: startedAt,
        candidateId: user.userId,
      },
    });

    return newAttempt;
  });

  const timerKey = `attempt:timer:${attempt.id}`;
  const ttlSeconds = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000) + 60);

  try {
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
      await redis.connect().catch(() => {});
    }
    await redis.set(
      timerKey,
      JSON.stringify({
        attemptId: attempt.id,
        assessmentId: invitation.assessment.id,
        candidateId: user.userId,
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      }),
      'EX',
      ttlSeconds,
    );
  } catch (err) {
    console.warn(`[Redis Timer]: Could not cache timer for ${timerKey}: ${(err as Error).message}`);
  }

  const sanitizedProblems = invitation.assessment.problems
    .filter((ap) => !ap.problem.deletedAt)
    .map((ap) => sanitizeProblemForCandidate(ap.problem, ap.customPoints));

  return {
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      tabSwitchCount: attempt.tabSwitchCount,
      durationMinutes,
      maxTabSwitches: invitation.assessment.maxTabSwitches,
    },
    assessment: {
      id: invitation.assessment.id,
      title: invitation.assessment.title,
      description: invitation.assessment.description,
      totalPoints: invitation.assessment.totalPoints,
      passingScore: invitation.assessment.passingScore,
      problems: sanitizedProblems,
    },
  };
};

export const AttemptService = {
  startAttempt,
  sanitizeProblemForCandidate,
};
