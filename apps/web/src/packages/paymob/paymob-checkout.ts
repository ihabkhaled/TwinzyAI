import { getSafeWindow } from '@/packages/browser';
import { publicEnv } from '@/packages/env';

import {
  PAYMOB_CHECKOUT_BASE_URL,
  PAYMOB_ID_QUERY_PATTERN,
  PAYMOB_POPUP_FEATURES,
  PAYMOB_POPUP_POLL_MS,
  PAYMOB_RETURN_MESSAGE_TYPE,
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

/** True for the {@link PAYMOB_RETURN_MESSAGE_TYPE} message from the return page. */
const isReturnMessage = (data: unknown): data is { transactionId: number | undefined } => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    record['type'] === PAYMOB_RETURN_MESSAGE_TYPE &&
    (record['transactionId'] === undefined || typeof record['transactionId'] === 'number')
  );
};

/**
 * Resolve when the checkout finishes — either the return page posts back (the
 * popup redirected on completion; carries the transaction id) or the buyer
 * closed the popup (no transaction id). Completion is NOT trusted here: the
 * backend verifies the ORDER with Paymob before delivering. The transaction id
 * is only relayed so an undelivered paid run can be refunded.
 */
export const awaitPaymobResult = (popup: Window): Promise<{ transactionId: number | undefined }> =>
  new Promise((resolve) => {
    const safeWindow = getSafeWindow();
    const timers: { interval?: ReturnType<typeof globalThis.setInterval> } = {};
    let settled = false;
    const finish = (transactionId: number | undefined): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (timers.interval !== undefined) {
        globalThis.clearInterval(timers.interval);
      }
      safeWindow?.removeEventListener('message', onMessage);
      resolve({ transactionId });
    };
    const onMessage = (event: MessageEvent): void => {
      if (event.origin !== safeWindow?.location.origin) {
        return;
      }
      if (isReturnMessage(event.data)) {
        popup.close();
        finish(event.data.transactionId);
      }
    };
    safeWindow?.addEventListener('message', onMessage);
    timers.interval = globalThis.setInterval(() => {
      if (popup.closed) {
        finish(undefined);
      }
    }, PAYMOB_POPUP_POLL_MS);
  });

/**
 * Run on the /paymob/return page the checkout popup lands on: read the Paymob
 * transaction id from the redirect query, hand it to the opener, and close the
 * popup automatically. The opener re-verifies server-side, so this only relays.
 */
export const relayPaymobReturn = (): void => {
  const safeWindow = getSafeWindow();
  if (safeWindow === null) {
    return;
  }
  const rawId = new URLSearchParams(safeWindow.location.search).get('id');
  const transactionId =
    rawId !== null && PAYMOB_ID_QUERY_PATTERN.test(rawId) ? Number(rawId) : undefined;
  // `Window.opener` is typed `any` by the DOM lib; narrow before calling it.
  const opener = safeWindow.opener as Window | null;
  opener?.postMessage(
    { type: PAYMOB_RETURN_MESSAGE_TYPE, transactionId },
    safeWindow.location.origin,
  );
  safeWindow.close();
};
