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

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  let transactionId = req.body?.transactionId;

  if (req.body?.data?.object?.client_reference_id) {
    transactionId = req.body.data.object.client_reference_id;
  } else if (req.body?.data?.object?.metadata?.transactionId) {
    transactionId = req.body.data.object.metadata.transactionId;
  } else if (req.body?.tran_id) {
    transactionId = req.body.tran_id;
  }

  if (!transactionId) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Transaction ID missing from webhook payload',
    });
    return;
  }

  const result = await PaymentService.handlePaymentSuccess(transactionId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Webhook processed and payment verified successfully',
    data: result,
  });
});

const handleSslSuccess = catchAsync(async (req: Request, res: Response) => {
  const transactionId = (req.body?.tran_id || req.query?.tran_id || req.query?.txn) as string;

  if (!transactionId) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Transaction ID missing from callback query',
    });
    return;
  }

  const result = await PaymentService.handlePaymentSuccess(transactionId, req.body || req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'SSLCommerz payment validated and credits applied successfully',
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;

  const result = await PaymentService.getPaymentById(id, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment details retrieved successfully',
    data: result,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await PaymentService.getMyPayments(user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Company payment records retrieved successfully',
    data: result,
  });
});

const simulateTestCheckout = catchAsync(async (req: Request, res: Response) => {
  const txn = req.query.txn as string;
  if (!txn) {
    res.status(400).send('<h1>Error: Missing transaction ID (txn)</h1>');
    return;
  }

  const result = await PaymentService.handlePaymentSuccess(txn, {
    simulated: true,
    timestamp: new Date().toISOString(),
  });

  const company = 'company' in result ? result.company : result.payment.company;

  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; background: #f8fafc;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 500px;">
          <h1 style="color: #16a34a; margin-bottom: 8px;">✓ Test Payment Successful!</h1>
          <p style="color: #4b5563;">Transaction <strong>${txn}</strong> was successfully verified.</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: left;">
            <p style="margin: 4px 0;"><strong>Assessment Credits:</strong> ${company.assessmentCredits} Total Credits</p>
            <p style="margin: 4px 0;"><strong>Active Tier:</strong> ${company.planTier}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> ${result.payment.status}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">You can now return to DevAssess or Postman to continue.</p>
        </div>
      </body>
    </html>
  `);
});

export const PaymentController = {
  initiatePayment,
  handleWebhook,
  handleSslSuccess,
  getPaymentById,
  getMyPayments,
  simulateTestCheckout,
};
