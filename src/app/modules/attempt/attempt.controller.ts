import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { AttemptService } from './attempt.service';

const startAttempt = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const ipAddress = req.ip || req.socket.remoteAddress;

  const result = await AttemptService.startAttempt(user, req.body, ipAddress);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Assessment attempt initiated successfully',
    data: result,
  });
});

export const AttemptController = {
  startAttempt,
};
