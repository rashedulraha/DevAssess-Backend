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

const submitProblem = catchAsync(async (req: Request, res: Response) => {
  const attemptId = req.params.id as string;
  const user = req.user!;

  const result = await AttemptService.submitProblem(attemptId, user, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Problem submission recorded successfully',
    data: result,
  });
});

const finalizeAttempt = catchAsync(async (req: Request, res: Response) => {
  const attemptId = req.params.id as string;
  const user = req.user!;

  const result = await AttemptService.finalizeAttempt(attemptId, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Assessment attempt finalized successfully',
    data: result,
  });
});

const logAntiCheatEvent = catchAsync(async (req: Request, res: Response) => {
  const attemptId = req.params.id as string;
  const user = req.user!;

  const result = await AttemptService.logAntiCheatEvent(attemptId, user, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Anti-cheat telemetry recorded successfully',
    data: result,
  });
});

export const AttemptController = {
  startAttempt,
  submitProblem,
  finalizeAttempt,
  logAntiCheatEvent,
};
