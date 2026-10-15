import { AssessmentStatus } from '@prisma/client';
import crypto from 'crypto';
import config from '../../config';
import { AppError } from '../../errors/AppError';
import { IAuthUser } from '../../interfaces';
import { logAudit } from '../../shared/auditLogger';
import { sendEmail } from '../../shared/emailSender';
import { prisma } from '../../shared/prisma';
import { IInviteCandidatesPayload } from './invitation.interface';

const inviteCandidates = async (
  assessmentId: string,
  user: IAuthUser,
  payload: IInviteCandidatesPayload,
) => {
  const { emails, expiresInDays = 7 } = payload;
  const uniqueEmails = Array.from(new Set(emails.map((e) => e.trim().toLowerCase())));

  const company = await prisma.company.findUnique({
    where: { ownerId: user.userId },
  });

  if (!company) {
    throw new AppError(400, 'Company profile is required before sending assessment invitations.');
  }

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      companyId: company.id,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(404, 'Assessment not found or does not belong to your company.');
  }

  if (assessment.status !== AssessmentStatus.PUBLISHED) {
    throw new AppError(
      400,
      `Cannot invite candidates to an assessment in ${assessment.status} status. It must be PUBLISHED.`,
    );
  }

  const existingInvitations = await prisma.candidateInvitation.findMany({
    where: {
      assessmentId,
      candidateEmail: { in: uniqueEmails },
    },
  });

  const alreadyInvitedEmails = new Set(existingInvitations.map((i) => i.candidateEmail));
  const newEmailsToInvite = uniqueEmails.filter((email) => !alreadyInvitedEmails.has(email));

  if (newEmailsToInvite.length === 0) {
    throw new AppError(400, 'All provided candidate emails have already been invited to this assessment.');
  }

  if (company.assessmentCredits < newEmailsToInvite.length) {
    throw new AppError(
      400,
      `Insufficient credits. You need ${newEmailsToInvite.length} credits, but currently have ${company.assessmentCredits} credits.`,
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const invitationsToCreate = await prisma.$transaction(async (tx) => {
    const updatedCompany = await tx.company.update({
      where: { id: company.id },
      data: {
        assessmentCredits: {
          decrement: newEmailsToInvite.length,
        },
      },
    });

    const registeredUsers = await tx.user.findMany({
      where: { email: { in: newEmailsToInvite } },
    });
    const userMap = new Map(registeredUsers.map((u) => [u.email, u.id]));

    const createdRows = [];
    for (const email of newEmailsToInvite) {
      const inviteToken = crypto.randomBytes(24).toString('hex');
      const candidateId = userMap.get(email) || null;

      const invitation = await tx.candidateInvitation.create({
        data: {
          assessmentId,
          candidateEmail: email,
          candidateId,
          inviteToken,
          expiresAt,
        },
      });

      createdRows.push(invitation);
    }

    await logAudit({
      actorId: user.userId,
      action: 'CANDIDATE_INVITED',
      entityType: 'Assessment',
      entityId: assessmentId,
      oldValue: { assessmentCredits: company.assessmentCredits },
      newValue: {
        assessmentCredits: updatedCompany.assessmentCredits,
        invitedCount: newEmailsToInvite.length,
        emails: newEmailsToInvite,
      },
      tx,
    });

    return createdRows;
  });

  for (const inv of invitationsToCreate) {
    const inviteLink = `${config.frontendPublicUrl || 'http://localhost:3000'}/assessments/invite/${inv.inviteToken}`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>You are invited to take a technical assessment!</h2>
        <p><strong>${company.name}</strong> has invited you to complete <strong>${assessment.title}</strong>.</p>
        <p><strong>Duration:</strong> ${assessment.durationMinutes} minutes</p>
        <p><strong>Passing Score:</strong> ${assessment.passingScore}%</p>
        <div style="margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Start Assessment
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This invitation link will expire on ${expiresAt.toUTCString()}.</p>
      </div>
    `;

    sendEmail({
      to: inv.candidateEmail,
      subject: `Technical Assessment Invitation: ${assessment.title} at ${company.name}`,
      html: emailHtml,
    }).catch((err) => console.error(`Error sending email to ${inv.candidateEmail}:`, err));
  }

  return {
    invitedCount: invitationsToCreate.length,
    remainingCredits: company.assessmentCredits - newEmailsToInvite.length,
    invitations: invitationsToCreate,
  };
};

const getMyInvitations = async (user: IAuthUser) => {
  const invitations = await prisma.candidateInvitation.findMany({
    where: {
      candidateEmail: user.email,
    },
    include: {
      assessment: {
        include: {
          company: {
            select: {
              name: true,
              logoUrl: true,
              website: true,
            },
          },
        },
      },
      attempt: {
        select: {
          id: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          totalScore: true,
          percentageScore: true,
          isPassed: true,
        },
      },
    },
    orderBy: {
      sentAt: 'desc',
    },
  });

  return invitations;
};

const getAssessmentInvitations = async (assessmentId: string, user: IAuthUser) => {
  const company = await prisma.company.findUnique({
    where: { ownerId: user.userId },
  });

  if (!company) {
    throw new AppError(400, 'Company profile not found.');
  }

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      companyId: company.id,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(404, 'Assessment not found or unauthorized.');
  }

  const invitations = await prisma.candidateInvitation.findMany({
    where: { assessmentId },
    include: {
      candidate: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
      attempt: {
        select: {
          id: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          totalScore: true,
          percentageScore: true,
          isPassed: true,
          tabSwitchCount: true,
        },
      },
    },
    orderBy: { sentAt: 'desc' },
  });

  return invitations;
};

export const InvitationService = {
  inviteCandidates,
  getMyInvitations,
  getAssessmentInvitations,
};
