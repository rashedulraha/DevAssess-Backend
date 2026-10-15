export const CREDIT_BUNDLES = {
  STARTER_25: {
    bundleId: 'STARTER_25',
    name: 'Starter Pack',
    credits: 25,
    amount: 1500, // BDT
    currency: 'BDT',
    planTier: 'STARTER',
  },
  PRO_100: {
    bundleId: 'PRO_100',
    name: 'Professional Hiring Pack',
    credits: 100,
    amount: 5000, // BDT
    currency: 'BDT',
    planTier: 'PRO',
  },
  ENTERPRISE_300: {
    bundleId: 'ENTERPRISE_300',
    name: 'Enterprise Scale Pack',
    credits: 300,
    amount: 12000, // BDT
    currency: 'BDT',
    planTier: 'ENTERPRISE',
  },
} as const;

export type BundleKey = keyof typeof CREDIT_BUNDLES;
