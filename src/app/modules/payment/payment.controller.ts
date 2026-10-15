import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { PaymentService } from './payment.service';

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await PaymentService.initiatePayment(user, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Payment session initiated successfully',
    data: result,
  });
});

export const PaymentController = {
  initiatePayment,
};
