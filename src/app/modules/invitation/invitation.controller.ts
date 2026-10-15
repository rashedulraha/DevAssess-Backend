import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { InvitationService } from './invitation.service';

const inviteCandidates = catchAsync(async (req: Request, res: Response) => {
  const assessmentId = req.params.id as string;
  const user = req.user!;

  const result = await InvitationService.inviteCandidates(assessmentId, user, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Candidate invitations dispatched successfully',
    data: result,
  });
});

const getMyInvitations = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await InvitationService.getMyInvitations(user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Candidate invitations retrieved successfully',
    data: result,
  });
});

const getAssessmentInvitations = catchAsync(async (req: Request, res: Response) => {
  const assessmentId = req.params.id as string;
  const user = req.user!;
  const result = await InvitationService.getAssessmentInvitations(assessmentId, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Assessment invitations retrieved successfully',
    data: result,
  });
});

export const InvitationController = {
  inviteCandidates,
  getMyInvitations,
  getAssessmentInvitations,
};
