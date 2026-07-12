import { getSafeDocument } from '@/packages/browser';
import { publicEnv } from '@/packages/env';

import { PAYPAL_SDK_BASE_URL, PAYPAL_SDK_SCRIPT_ID } from './paypal.constants';
import type {
  PayPalButtonsConfig,
  PayPalButtonsHandle,
  PayPalOrderActions,
} from './paypal-sdk.types';

/**
 * The single wrapper around the PayPal JS Buttons SDK. The rest of the app
 * never touches `window.paypal` or injects the script itself, so swapping the
 * provider (or stubbing it in tests/e2e) touches only this file. The SDK is
 * loaded lazily, once, from the official origin with the PUBLIC client id.
 */

interface PayPalButtonsInstance {
  render: (container: HTMLElement) => Promise<void>;
  close?: () => void;
}

interface PayPalNamespace {
  Buttons: (options: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }, actions: PayPalOrderActions) => Promise<void>;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
  }) => PayPalButtonsInstance;
}

const getPayPal = (): PayPalNamespace | undefined =>
  (globalThis as { paypal?: PayPalNamespace }).paypal;

/** Whether the frontend paywall is configured (public client id present). */
export const isPayPalConfigured = (): boolean => publicEnv.paypalClientId !== undefined;

/** Load the PayPal SDK script once; resolves when `window.paypal` is ready. */
const loadPayPalSdk = async (): Promise<void> => {
  if (getPayPal() !== undefined) {
    return;
  }
  const clientId = publicEnv.paypalClientId;
  if (clientId === undefined) {
    throw new Error('PayPal is not configured.');
  }
  await injectScript(clientId);
};

const injectScript = (clientId: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const doc = getSafeDocument();
    if (doc === null) {
      reject(new Error('PayPal SDK cannot load outside the browser.'));
      return;
    }
    const onLoad = (): void => {
      resolve();
    };
    const onError = (): void => {
      reject(new Error('PayPal SDK failed to load.'));
    };
    const existing = doc.querySelector(`#${PAYPAL_SDK_SCRIPT_ID}`);
    if (existing !== null) {
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', onError);
      return;
    }
    const script = doc.createElement('script');
    script.id = PAYPAL_SDK_SCRIPT_ID;
    const params = new URLSearchParams({ 'client-id': clientId, components: 'buttons' });
    script.src = `${PAYPAL_SDK_BASE_URL}?${params.toString()}`;
    script.async = true;
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    doc.head.append(script);
  });

/** A handle for a render that was cancelled before it painted anything. */
const NOOP_HANDLE: PayPalButtonsHandle = { close: (): void => undefined };

/**
 * Render the PayPal buttons into `container`. Bridges our typed config onto the
 * SDK's callback shape; `onApprove` captures server-side (our backend verifies
 * the capture) before resolving. Returns a handle to tear the buttons down.
 *
 * `signal` cancels the render: because loading the SDK is async, a React
 * StrictMode remount (or an unmount) can happen mid-load. Checking the signal
 * BEFORE painting means a cancelled render never appends buttons — without it,
 * the first, soon-to-be-discarded mount briefly flashes a second set of buttons.
 * The container is also cleared before rendering so no stale buttons linger.
 */
export const renderPayPalButtons = async (
  container: HTMLElement,
  config: PayPalButtonsConfig,
  signal?: AbortSignal,
): Promise<PayPalButtonsHandle> => {
  await loadPayPalSdk();
  // The only async gap where a StrictMode/unmount teardown can land is the SDK
  // load above; bail before building or painting anything so no buttons flash.
  if (signal?.aborted ?? false) {
    return NOOP_HANDLE;
  }
  const paypal = getPayPal();
  if (paypal === undefined) {
    throw new Error('PayPal SDK unavailable after load.');
  }
  container.replaceChildren();
  const instance = paypal.Buttons({
    createOrder: config.createOrder,
    onApprove: async (data) => {
      await config.onApprove(data.orderID);
    },
    ...(config.onCancel !== undefined && { onCancel: config.onCancel }),
    ...(config.onError !== undefined && { onError: config.onError }),
  });
  await instance.render(container);
  return {
    close: (): void => {
      instance.close?.();
    },
  };
};
