export const CREDIT_BUNDLES = {
  STARTER_25: {
    bundleId: 'STARTER_25',
    name: 'Starter Pack',
    credits: 25,
    amount: 15, // USD
    currency: 'USD',
    planTier: 'STARTER',
  },
  PRO_100: {
    bundleId: 'PRO_100',
    name: 'Professional Hiring Pack',
    credits: 100,
    amount: 49, // USD
    currency: 'USD',
    planTier: 'PRO',
  },
  ENTERPRISE_300: {
    bundleId: 'ENTERPRISE_300',
    name: 'Enterprise Scale Pack',
    credits: 300,
    amount: 129, // USD
    currency: 'USD',
    planTier: 'ENTERPRISE',
  },
} as const;

export type BundleKey = keyof typeof CREDIT_BUNDLES;
