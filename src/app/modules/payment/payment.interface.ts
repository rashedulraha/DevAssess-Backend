import { BundleKey } from './payment.constant';

export type PaymentProvider = 'STRIPE' | 'SSLCOMMERZ';

export interface IInitiatePaymentPayload {
  bundle: BundleKey;
  provider?: PaymentProvider;
}

export interface IInitiatePaymentResponse {
  paymentId: string;
  transactionId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  creditsPurchased: number;
  provider: string;
}
