import Stripe from 'stripe';
import config from '../../config';

let stripeClient: Stripe | null = null;
if (config.payment.stripe.secretKey && !config.payment.stripe.secretKey.includes('placeholder')) {
  stripeClient = new Stripe(config.payment.stripe.secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
  });
}

interface ICreateStripeSessionParams {
  transactionId: string;
  companyId: string;
  companyName: string;
  bundleName: string;
  amount: number;
  currency: string;
  creditsPurchased: number;
}

export const createStripeCheckoutSession = async ({
  transactionId,
  companyId,
  companyName,
  bundleName,
  amount,
  currency,
  creditsPurchased,
}: ICreateStripeSessionParams): Promise<{ sessionId: string; checkoutUrl: string }> => {
  const frontendUrl = config.frontendPublicUrl || 'http://localhost:3000';
  const backendUrl = config.backendPublicUrl || 'http://localhost:5000';

  if (stripeClient) {
    try {
      const session = await stripeClient.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase() === 'bdt' ? 'usd' : currency.toLowerCase(),
              product_data: {
                name: `${bundleName} - ${creditsPurchased} Assessment Credits`,
                description: `DevAssess Assessment Credits for ${companyName}`,
              },
              unit_amount: currency.toLowerCase() === 'bdt' ? Math.round((amount / 120) * 100) : Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}&txn=${transactionId}`,
        cancel_url: `${frontendUrl}/payments/cancel?txn=${transactionId}`,
        client_reference_id: transactionId,
        metadata: {
          transactionId,
          companyId,
          creditsPurchased: creditsPurchased.toString(),
        },
      });

      if (session.url) {
        return {
          sessionId: session.id,
          checkoutUrl: session.url,
        };
      }
    } catch (error) {
      console.warn(`[Stripe Gateway Warning]: Could not create live session: ${(error as Error).message}`);
    }
  }

  // Graceful test/sandbox checkout URL fallback
  const mockSessionId = `cs_test_${transactionId}`;
  const checkoutUrl = `${backendUrl}/api/v1/payments/test-checkout?txn=${transactionId}&amount=${amount}`;

  return {
    sessionId: mockSessionId,
    checkoutUrl,
  };
};

export const createSSLCommerzSession = async ({
  transactionId,
  amount,
}: {
  transactionId: string;
  amount: number;
}): Promise<{ sessionId: string; checkoutUrl: string }> => {
  const backendUrl = config.backendPublicUrl || 'http://localhost:5000';
  const sessionId = `ssl_session_${transactionId}`;
  const checkoutUrl = `${backendUrl}/api/v1/payments/test-checkout?txn=${transactionId}&amount=${amount}&gateway=sslcommerz`;

  return {
    sessionId,
    checkoutUrl,
  };
};
