import { PAYPAL_ME_USERNAME_PATTERN, publicEnv } from '@/packages/env';
import { PAYPAL_ME_BASE_URL } from '@/shared/constants/donate.constants';

/**
 * Build the outbound PayPal.me donation URL for an already-validated handle.
 * Defense in depth: the handle was validated once at env parse time, and is
 * re-checked here so no future call site can ever interpolate an unvalidated
 * value into an outbound URL. The app never processes money — this is a plain
 * link to PayPal; scheme and host are hardcoded.
 */
export const buildPayPalDonateUrl = (username: string): string => {
  if (!PAYPAL_ME_USERNAME_PATTERN.test(username)) {
    throw new Error('Invalid PayPal.me handle: refusing to build a donate URL.');
  }

  return `${PAYPAL_ME_BASE_URL}/${username}`;
};

/**
 * The donate URL for the configured handle, or undefined when the feature is
 * off (no NEXT_PUBLIC_PAYPAL_ME_USERNAME configured) — callers hide the link.
 */
export const resolveDonateUrl = (): string | undefined =>
  publicEnv.paypalMeUsername === undefined
    ? undefined
    : buildPayPalDonateUrl(publicEnv.paypalMeUsername);
