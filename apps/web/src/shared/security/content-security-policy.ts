import { PAYPAL_CSP_ORIGINS } from '@/packages/paypal';

/** Inputs the CSP is built from (all resolved once in the proxy). */
export interface ContentSecurityPolicyInput {
  nonce: string;
  isDevRuntime: boolean;
  apiBaseUrl: string;
  /** Present ⇒ the paywall is configured and PayPal origins are allowed. */
  paypalClientId: string | undefined;
}

/**
 * Build the per-request Content-Security-Policy. A fresh nonce authorizes only
 * this response's inline scripts; `strict-dynamic` lets Next's runtime load its
 * chunks from that trusted root. `connect-src` allows the NestJS API origin so
 * the game gateway can reach it. `'unsafe-eval'` is allowed only under the
 * `next dev` runtime (React Refresh). PayPal origins are added ONLY when the
 * paywall is configured, so the free game's policy is never loosened; when on,
 * the Buttons SDK script + logos (from www.paypalobjects.com), its checkout
 * iframe, and its REST calls are all permitted (see PAYPAL_CSP_ORIGINS).
 *
 * Pure and fully parameterized so the whole policy is unit-testable without a
 * request or the environment.
 */
export const buildContentSecurityPolicy = ({
  nonce,
  isDevRuntime,
  apiBaseUrl,
  paypalClientId,
}: ContentSecurityPolicyInput): string => {
  const paypal = paypalClientId === undefined ? '' : ` ${PAYPAL_CSP_ORIGINS.join(' ')}`;
  // The PayPal SDK loads its own further scripts, so it needs host-based
  // allowance here (nonce/strict-dynamic alone cannot authorize them).
  const scriptSrc = isDevRuntime
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'${paypal}`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${paypal}`;

  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:${paypal}`,
    `font-src 'self'${paypal}`,
    `connect-src 'self' ${apiBaseUrl}${paypal}`,
    `frame-src 'self'${paypal}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');
};
