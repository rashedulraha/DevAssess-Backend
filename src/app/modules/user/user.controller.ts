import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { UserService } from './user.service';

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await UserService.getMyProfile(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  let payload = req.body;
  if (req.body?.data && typeof req.body.data === 'string') {
    try {
      payload = JSON.parse(req.body.data);
    } catch {
      payload = req.body;
    }
  }

  const files = req.files as {
    avatar?: Express.Multer.File[];
    resume?: Express.Multer.File[];
  };

  const result = await UserService.updateMyProfile(userId, payload, files);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile updated successfully',
    data: result,
  });
});

export const UserController = {
  getMyProfile,
  updateMyProfile,
};
