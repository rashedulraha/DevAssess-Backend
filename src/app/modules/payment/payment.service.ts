import crypto from 'crypto';
import { PaymentStatus } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { IAuthUser } from '../../interfaces';
import { prisma } from '../../shared/prisma';
import { CREDIT_BUNDLES } from './payment.constant';
import { createSSLCommerzSession, createStripeCheckoutSession } from './payment.gateway';
import { IInitiatePaymentPayload, IInitiatePaymentResponse } from './payment.interface';

const initiatePayment = async (
  user: IAuthUser,
  payload: IInitiatePaymentPayload,
): Promise<IInitiatePaymentResponse> => {
  const company = await prisma.company.findUnique({
    where: { ownerId: user.userId },
  });

  if (!company) {
    throw new AppError(400, 'Company profile is required before purchasing assessment credits.');
  }

  const bundle = CREDIT_BUNDLES[payload.bundle];
  if (!bundle) {
    throw new AppError(400, 'Invalid credit bundle selected.');
  }

  const provider = payload.provider || 'STRIPE';
  const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  let sessionResult: { sessionId: string; checkoutUrl: string };

  if (provider === 'SSLCOMMERZ') {
    sessionResult = await createSSLCommerzSession({
      transactionId,
      amount: bundle.amount,
    });
  } else {
    sessionResult = await createStripeCheckoutSession({
      transactionId,
      companyId: company.id,
      companyName: company.name,
      bundleName: bundle.name,
      amount: bundle.amount,
      currency: bundle.currency,
      creditsPurchased: bundle.credits,
    });
  }

  const payment = await prisma.payment.create({
    data: {
      companyId: company.id,
      provider,
      transactionId,
      gatewaySessionId: sessionResult.sessionId,
      amount: bundle.amount,
      currency: bundle.currency,
      creditsPurchased: bundle.credits,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    paymentId: payment.id,
    transactionId: payment.transactionId,
    checkoutUrl: sessionResult.checkoutUrl,
    amount: payment.amount,
    currency: payment.currency,
    creditsPurchased: payment.creditsPurchased,
    provider: payment.provider,
  };
};

export const PaymentService = {
  initiatePayment,
};
