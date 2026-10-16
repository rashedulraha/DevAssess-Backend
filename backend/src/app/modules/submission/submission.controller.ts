import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { SubmissionService } from './submission.service';

const evaluateSubmission = catchAsync(async (req: Request, res: Response) => {
  const submissionId = req.params.id as string;
  const user = req.user!;

  const result = await SubmissionService.evaluateSubmission(submissionId, user, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Submission evaluated and attempt score recalculated successfully',
    data: result,
  });
});

export const SubmissionController = {
  evaluateSubmission,
};
