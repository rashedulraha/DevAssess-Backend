import { AttemptStatus, Role } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { IAuthUser } from '../../interfaces';
import { prisma } from '../../shared/prisma';
import { redis } from '../../shared/redis';
import { IEvaluateSubmissionPayload } from './submission.interface';

const evaluateSubmission = async (
  submissionId: string,
  user: IAuthUser,
  payload: IEvaluateSubmissionPayload,
) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      attempt: {
        include: {
          assessment: {
            include: {
              problems: true,
            },
          },
        },
      },
      problem: true,
    },
  });

  if (!submission) {
    throw new AppError(404, 'Submission not found.');
  }

  if (user.role === Role.RECRUITER) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.userId },
    });
    if (!company || submission.attempt.assessment.companyId !== company.id) {
      throw new AppError(403, 'Forbidden: You can only evaluate submissions belonging to your company.');
    }
  }

  const assessmentProblem = submission.attempt.assessment.problems.find(
    (ap) => ap.problemId === submission.problemId,
  );
  const maxScore = assessmentProblem?.customPoints ?? submission.problem.maxScore;

  if (payload.awardedScore > maxScore) {
    throw new AppError(
      400,
      `Awarded score (${payload.awardedScore}) cannot exceed problem maximum score (${maxScore}).`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedSubmission = await tx.submission.update({
      where: { id: submissionId },
      data: {
        awardedScore: payload.awardedScore,
        evaluatorNotes: payload.evaluatorNotes,
        evaluatorId: user.userId,
      },
    });

    const allSubmissions = await tx.submission.findMany({
      where: { attemptId: submission.attemptId },
    });

    const newTotalScore = allSubmissions.reduce((acc, s) => acc + s.awardedScore, 0);
    const totalPoints = submission.attempt.assessment.totalPoints || 100;
    const percentageScore = totalPoints > 0 ? (newTotalScore / totalPoints) * 100 : 0;
    const isPassed = percentageScore >= submission.attempt.assessment.passingScore;

    const updatedAttempt = await tx.assessmentAttempt.update({
      where: { id: submission.attemptId },
      data: {
        totalScore: newTotalScore,
        percentageScore: Math.round(percentageScore * 100) / 100,
        isPassed,
        status: AttemptStatus.EVALUATED,
        evaluatedAt: new Date(),
      },
    });

    return {
      submission: updatedSubmission,
      attempt: updatedAttempt,
    };
  });

  try {
    await redis.del(`report:assessment:${submission.attempt.assessmentId}`);
  } catch (err) {
    // Ignore Redis errors
  }

  return result;
};

export const SubmissionService = {
  evaluateSubmission,
};
