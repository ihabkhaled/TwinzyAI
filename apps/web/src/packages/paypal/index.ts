/**
 * Public facade for the PayPal Buttons SDK. The `@paypal/*` scripts and
 * `window.paypal` are touched only inside this package.
 */

export { PAYPAL_CSP_ORIGINS } from './paypal.constants';
export { isPayPalConfigured, renderPayPalButtons } from './paypal-sdk';
export type { PayPalButtonsConfig, PayPalButtonsHandle } from './paypal-sdk.types';
