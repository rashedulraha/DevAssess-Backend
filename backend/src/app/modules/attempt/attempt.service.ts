import { AttemptStatus, InvitationStatus, Problem, ProblemType } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { IAuthUser } from '../../interfaces';
import { prisma } from '../../shared/prisma';
import { redis } from '../../shared/redis';
import { logAudit } from '../../shared/auditLogger';
import { evaluateCodingSubmission, evaluateMcqSubmission } from './attempt.evaluator';
import {
  IAntiCheatEventPayload,
  IStartAttemptPayload,
  ISubmitProblemPayload,
} from './attempt.interface';

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

const submitProblem = async (
  attemptId: string,
  user: IAuthUser,
  payload: ISubmitProblemPayload,
) => {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        include: {
          problems: {
            where: { problemId: payload.problemId },
            include: { problem: true },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(404, 'Assessment attempt not found.');
  }

  if (attempt.candidateId !== user.userId) {
    throw new AppError(403, 'Forbidden: You do not own this attempt.');
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError(400, `Cannot submit answer. Attempt is already ${attempt.status.toLowerCase()}.`);
  }

  const gracePeriodMs = 30 * 1000;
  if (Date.now() > attempt.expiresAt.getTime() + gracePeriodMs) {
    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { status: AttemptStatus.TIMED_OUT },
    });
    throw new AppError(400, 'Assessment time limit has expired (including grace period).');
  }

  const assessmentProblem = attempt.assessment.problems[0];
  if (!assessmentProblem) {
    throw new AppError(404, 'Problem is not associated with this assessment.');
  }

  const problem = assessmentProblem.problem;
  const maxPoints = assessmentProblem.customPoints ?? problem.maxScore;

  let awardedScore = 0;
  let passedTestCases = 0;
  let totalTestCases = 0;
  let isAutoEvaluated = false;

  if (problem.type === ProblemType.MCQ) {
    if (payload.selectedOption) {
      const evaluation = evaluateMcqSubmission(
        payload.selectedOption,
        (problem.options as Array<{ id: string; text: string; isCorrect?: boolean }>) || [],
        maxPoints,
      );
      awardedScore = evaluation.awardedScore;
      isAutoEvaluated = true;
    }
  } else if (problem.type === ProblemType.CODING) {
    if (payload.sourceCode) {
      const evaluation = evaluateCodingSubmission(
        payload.sourceCode,
        (problem.testCases as Array<{ input: string; expectedOutput: string; isHidden?: boolean }>) || [],
        maxPoints,
      );
      awardedScore = evaluation.awardedScore;
      passedTestCases = evaluation.passedTestCases;
      totalTestCases = evaluation.totalTestCases;
      isAutoEvaluated = true;
    }
  } else {
    isAutoEvaluated = false;
    awardedScore = 0;
  }

  const submission = await prisma.submission.upsert({
    where: {
      attemptId_problemId: {
        attemptId,
        problemId: payload.problemId,
      },
    },
    update: {
      selectedOption: payload.selectedOption,
      writtenAnswer: payload.writtenAnswer,
      sourceCode: payload.sourceCode,
      language: payload.language,
      passedTestCases,
      totalTestCases,
      awardedScore,
      isAutoEvaluated,
      submittedAt: new Date(),
    },
    create: {
      attemptId,
      problemId: payload.problemId,
      selectedOption: payload.selectedOption,
      writtenAnswer: payload.writtenAnswer,
      sourceCode: payload.sourceCode,
      language: payload.language,
      passedTestCases,
      totalTestCases,
      awardedScore,
      isAutoEvaluated,
    },
  });

  return submission;
};

const finalizeAttempt = async (attemptId: string, user: IAuthUser) => {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        include: {
          problems: {
            include: { problem: true },
          },
        },
      },
      submissions: true,
    },
  });

  if (!attempt) {
    throw new AppError(404, 'Assessment attempt not found.');
  }

  if (attempt.candidateId !== user.userId) {
    throw new AppError(403, 'Forbidden: You do not own this attempt.');
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError(400, `Attempt is already ${attempt.status.toLowerCase()}.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const totalScore = attempt.submissions.reduce((acc, s) => acc + s.awardedScore, 0);
    const totalPoints = attempt.assessment.totalPoints || 100;
    const percentageScore = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    const isPassed = percentageScore >= attempt.assessment.passingScore;

    const hasWrittenProblems = attempt.assessment.problems.some(
      (ap) => ap.problem.type === ProblemType.WRITTEN,
    );

    const finalStatus = hasWrittenProblems ? AttemptStatus.SUBMITTED : AttemptStatus.EVALUATED;
    const now = new Date();

    const updatedAttempt = await tx.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: finalStatus,
        totalScore,
        percentageScore: Math.round(percentageScore * 100) / 100,
        isPassed,
        submittedAt: now,
        evaluatedAt: finalStatus === AttemptStatus.EVALUATED ? now : null,
      },
    });

    return updatedAttempt;
  });

  try {
    await redis.del(`attempt:timer:${attemptId}`);
  } catch (err) {
    // Ignore redis error
  }

  return result;
};

const logAntiCheatEvent = async (
  attemptId: string,
  user: IAuthUser,
  payload: IAntiCheatEventPayload,
) => {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { assessment: true },
  });

  if (!attempt) {
    throw new AppError(404, 'Assessment attempt not found.');
  }

  if (attempt.candidateId !== user.userId) {
    throw new AppError(403, 'Forbidden: You do not own this attempt.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const antiCheatLog = await tx.antiCheatLog.create({
      data: {
        attemptId,
        eventType: payload.eventType,
        metadata: payload.metadata ? JSON.parse(JSON.stringify(payload.metadata)) : undefined,
      },
    });

    const isProctorViolation = ['TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT'].includes(
      payload.eventType,
    );

    let currentAttempt = attempt;
    if (isProctorViolation) {
      currentAttempt = await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          tabSwitchCount: { increment: 1 },
        },
        include: { assessment: true },
      });
    }

    let isFlagged = currentAttempt.status === AttemptStatus.FLAGGED;
    if (
      currentAttempt.tabSwitchCount > currentAttempt.assessment.maxTabSwitches &&
      currentAttempt.status !== AttemptStatus.FLAGGED
    ) {
      await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: { status: AttemptStatus.FLAGGED },
      });

      await logAudit({
        actorId: user.userId,
        action: 'ATTEMPT_FLAGGED',
        entityType: 'AssessmentAttempt',
        entityId: attemptId,
        oldValue: { status: currentAttempt.status },
        newValue: {
          status: AttemptStatus.FLAGGED,
          tabSwitchCount: currentAttempt.tabSwitchCount,
          maxAllowed: currentAttempt.assessment.maxTabSwitches,
          triggerEvent: payload.eventType,
        },
        tx,
      });

      isFlagged = true;
    }

    return {
      logId: antiCheatLog.id,
      eventType: antiCheatLog.eventType,
      tabSwitchCount: currentAttempt.tabSwitchCount,
      maxTabSwitches: currentAttempt.assessment.maxTabSwitches,
      isFlagged,
    };
  });

  return result;
};

export const AttemptService = {
  startAttempt,
  submitProblem,
  finalizeAttempt,
  logAntiCheatEvent,
  sanitizeProblemForCandidate,
};
