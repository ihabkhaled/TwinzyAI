import { getSafeWindow } from '@/packages/browser';
import { publicEnv } from '@/packages/env';

import {
  PAYMOB_CHECKOUT_BASE_URL,
  PAYMOB_POPUP_FEATURES,
  PAYMOB_POPUP_POLL_MS,
} from './paymob.constants';

/**
 * The single wrapper around Paymob's hosted unified checkout. The rest of the
 * app never builds the checkout URL or touches `window.open` for payments, so a
 * provider change (or a test stub) touches only this file.
 */

/** Whether the frontend Paymob option is configured (public key present). */
export const isPaymobConfigured = (): boolean => publicEnv.paymobPublicKey !== undefined;

/** The hosted unified-checkout URL for one intention (public key + client secret). */
const buildCheckoutUrl = (publicKey: string, clientSecret: string): string => {
  const params = new URLSearchParams({ publicKey, clientSecret });
  return `${PAYMOB_CHECKOUT_BASE_URL}?${params.toString()}`;
};

/**
 * Open a blank popup SYNCHRONOUSLY inside the click handler (before the async
 * intention call) so the browser's popup blocker allows it. Returns null when
 * the popup was blocked or the window is unavailable (SSR).
 */
export const openPaymobPopup = (): Window | null => {
  const safeWindow = getSafeWindow();
  if (safeWindow === null) {
    return null;
  }
  return safeWindow.open('about:blank', 'paymob-checkout', PAYMOB_POPUP_FEATURES);
};

/** Point an already-open popup at the checkout for this intention. */
export const startPaymobCheckout = (
  popup: Window,
  publicKey: string,
  clientSecret: string,
): void => {
  popup.location.href = buildCheckoutUrl(publicKey, clientSecret);
};

/**
 * Resolve when the checkout popup closes (the buyer finished or cancelled).
 * Completion is deliberately NOT trusted here — the backend verifies with
 * Paymob whether the request was actually paid before delivering the result.
 */
export const awaitPaymobPopupClosed = (popup: Window): Promise<void> =>
  new Promise((resolve) => {
    const timer = globalThis.setInterval(() => {
      if (!popup.closed) {
        return;
      }
      globalThis.clearInterval(timer);
      resolve();
    }, PAYMOB_POPUP_POLL_MS);
  });
