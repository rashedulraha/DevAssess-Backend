import crypto from 'crypto';
import { PaymentStatus, Role } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { IAuthUser } from '../../interfaces';
import { logAudit } from '../../shared/auditLogger';
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

const handlePaymentSuccess = async (
  transactionId: string,
  rawPayload?: Record<string, unknown>,
) => {
  const payment = await prisma.payment.findUnique({
    where: { transactionId },
    include: { company: true },
  });

  if (!payment) {
    throw new AppError(404, `Payment with transaction ID ${transactionId} not found.`);
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return {
      message: 'Payment has already been processed successfully.',
      payment,
      alreadyProcessed: true,
    };
  }

  let newPlanTier = payment.company.planTier;
  if (payment.creditsPurchased >= 300) {
    newPlanTier = 'ENTERPRISE';
  } else if (payment.creditsPurchased >= 100) {
    newPlanTier = 'PRO';
  } else if (payment.creditsPurchased >= 25 && newPlanTier === 'FREE') {
    newPlanTier = 'STARTER';
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
        rawWebhookPayload: rawPayload ? JSON.parse(JSON.stringify(rawPayload)) : undefined,
      },
    });

    const updatedCompany = await tx.company.update({
      where: { id: payment.companyId },
      data: {
        assessmentCredits: {
          increment: payment.creditsPurchased,
        },
        planTier: newPlanTier,
      },
    });

    await logAudit({
      actorId: payment.company.ownerId,
      action: 'PAYMENT_COMPLETED',
      entityType: 'Payment',
      entityId: payment.id,
      oldValue: {
        assessmentCredits: payment.company.assessmentCredits,
        planTier: payment.company.planTier,
        status: payment.status,
      },
      newValue: {
        assessmentCredits: updatedCompany.assessmentCredits,
        planTier: updatedCompany.planTier,
        status: PaymentStatus.COMPLETED,
        transactionId: payment.transactionId,
        amount: payment.amount,
      },
      tx,
    });

    return {
      payment: updatedPayment,
      company: updatedCompany,
      alreadyProcessed: false,
    };
  });

  return result;
};

const getPaymentById = async (id: string, user: IAuthUser) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          assessmentCredits: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, 'Payment record not found.');
  }

  if (user.role === Role.RECRUITER && payment.company.ownerId !== user.userId) {
    throw new AppError(403, 'Forbidden: You do not have permission to access this payment record.');
  }

  return payment;
};

const getMyPayments = async (user: IAuthUser) => {
  const company = await prisma.company.findUnique({
    where: { ownerId: user.userId },
  });

  if (!company) {
    throw new AppError(400, 'Company profile not found.');
  }

  const payments = await prisma.payment.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
  });

  return payments;
};

export const PaymentService = {
  initiatePayment,
  handlePaymentSuccess,
  getPaymentById,
  getMyPayments,
};
