/** Official PayPal JS SDK origin (hardcoded; only the client-id query varies). */
export const PAYPAL_SDK_BASE_URL = 'https://www.paypal.com/sdk/js';

/** DOM id of the injected SDK <script>, so it is loaded at most once. */
export const PAYPAL_SDK_SCRIPT_ID = 'paypal-sdk';

/** Origins the CSP must allow when the paywall is on (script + iframe + api). */
export const PAYPAL_CSP_ORIGINS = [
  'https://www.paypal.com',
  'https://www.sandbox.paypal.com',
  'https://*.paypal.com',
] as const;
