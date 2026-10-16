import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { CompanyService } from './company.service';

const upsertCompany = catchAsync(async (req: Request, res: Response) => {
  const ownerId = req.user!.userId;

  let payload = req.body;
  if (req.body?.data && typeof req.body.data === 'string') {
    try {
      payload = JSON.parse(req.body.data);
    } catch {
      payload = req.body;
    }
  }

  const result = await CompanyService.upsertCompany(ownerId, payload, req.file);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Company profile saved successfully',
    data: result,
  });
});

const getMyCompany = catchAsync(async (req: Request, res: Response) => {
  const ownerId = req.user!.userId;
  const result = await CompanyService.getMyCompany(ownerId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Company profile retrieved successfully',
    data: result,
  });
});

export const CompanyController = {
  upsertCompany,
  getMyCompany,
};
