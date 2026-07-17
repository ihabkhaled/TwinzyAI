/**
 * Paymob unified checkout — a hosted page opened in a popup WINDOW (not an
 * iframe or the embedded Pixel button). The embedded flows redirect on
 * completion, which in this app would navigate away from the in-memory photo
 * (never persisted) and lose the run. A popup keeps the main app untouched;
 * the backend verifies the payment with Paymob at consumption.
 */
export const PAYMOB_CHECKOUT_BASE_URL = 'https://accept.paymob.com/unifiedcheckout/';

/** Popup window features for the checkout window. */
export const PAYMOB_POPUP_FEATURES = 'popup=yes,width=480,height=760';

/** How often (ms) to poll whether the checkout popup has closed. */
export const PAYMOB_POPUP_POLL_MS = 500;
