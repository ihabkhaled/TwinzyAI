import { ADSENSE_CSP_ORIGINS } from '@/packages/adsense';
import { PAYPAL_CSP_ORIGINS } from '@/packages/paypal';

/** Inputs the CSP is built from (all resolved once in the proxy). */
export interface ContentSecurityPolicyInput {
  nonce: string;
  isDevRuntime: boolean;
  apiBaseUrl: string;
  /** Present ⇒ the paywall is configured and PayPal origins are allowed. */
  paypalClientId: string | undefined;
  /** Present ⇒ ads are switched on and the AdSense origins are allowed. */
  adsenseClientId: string | undefined;
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
  adsenseClientId,
}: ContentSecurityPolicyInput): string => {
  const paypal = paypalClientId === undefined ? '' : ` ${PAYPAL_CSP_ORIGINS.join(' ')}`;
  // AdSense pulls further scripts, renders creatives in iframes, and reports
  // measurement calls, so it needs script/img/frame/connect allowance — added
  // ONLY when a publisher id is set, so the ad-free build stays locked down.
  const adsense = adsenseClientId === undefined ? '' : ` ${ADSENSE_CSP_ORIGINS.join(' ')}`;
  // The Buttons SDK serves its button fonts as inline data: URIs, so font-src
  // needs `data:` in addition to the PayPal hosts — only when the paywall is on,
  // so the free game's font-src stays a minimal `'self'`.
  const fontSrc = paypal === '' ? `font-src 'self'` : `font-src 'self' data:${paypal}`;
  // The PayPal SDK loads its own further scripts, so it needs host-based
  // allowance here (nonce/strict-dynamic alone cannot authorize them).
  const scriptSrc = isDevRuntime
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'${paypal}${adsense}`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${paypal}${adsense}`;

  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:${paypal}${adsense}`,
    fontSrc,
    `connect-src 'self' ${apiBaseUrl}${paypal}${adsense}`,
    `frame-src 'self'${paypal}${adsense}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');
};
