import { publicEnv } from '@/packages/env';

/**
 * The buyer-facing price string for the payment step, formatted from the public
 * env (which mirrors the server's authoritative PAYMENT_PRICE_VALUE/CURRENCY).
 * Uses Intl currency formatting so "0.50"/"USD" renders as "$0.50" and other
 * currencies get their correct symbol/placement. Falls back to a plain
 * "value currency" string if the runtime lacks the currency data.
 */
export const resolvePaymentPriceLabel = (): string => {
  const value = Number(publicEnv.paymentPriceValue);
  const currency = publicEnv.paymentPriceCurrency;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${publicEnv.paymentPriceValue} ${currency}`;
  }
};
