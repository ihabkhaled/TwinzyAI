/** Official PayPal JS SDK origin (hardcoded; only the client-id query varies). */
export const PAYPAL_SDK_BASE_URL = 'https://www.paypal.com/sdk/js';

/** DOM id of the injected SDK <script>, so it is loaded at most once. */
export const PAYPAL_SDK_SCRIPT_ID = 'paypal-sdk';

/**
 * Origins the CSP must allow when the paywall is on. The Buttons SDK pulls its
 * script + button logos/fonts from `www.paypalobjects.com` (a SEPARATE domain
 * from paypal.com, so `*.paypal.com` does NOT cover it — omitting it renders
 * the buttons as broken images), the checkout iframe + REST calls from
 * paypal.com / api-m.*.paypal.com (covered by the wildcard), and the sandbox
 * host for sandbox mode.
 */
export const PAYPAL_CSP_ORIGINS = [
  'https://www.paypal.com',
  'https://www.paypalobjects.com',
  'https://www.sandbox.paypal.com',
  'https://*.paypal.com',
] as const;
