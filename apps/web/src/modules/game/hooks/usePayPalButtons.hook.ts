'use client';
// client-boundary-reason: renders the PayPal Buttons SDK into a DOM node and owns its mount/teardown lifecycle, which exist only in the browser.

import { useEffect, useRef } from 'react';

import type { PayPalButtonsConfig, PayPalButtonsHandle } from '@/packages/paypal';
import { renderPayPalButtons } from '@/packages/paypal';

import type { PayPalButtonsController } from '../model/payment.types';

/**
 * Mounts the PayPal buttons into a returned ref once, tears them down on
 * unmount, and reports load failure through the config's `onError`. The config
 * callbacks are read from a ref so re-renders never re-mount the buttons.
 */
export const usePayPalButtons = (config: PayPalButtonsConfig): PayPalButtonsController => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }
    const controller = new AbortController();
    let handle: PayPalButtonsHandle | undefined;

    const bridge: PayPalButtonsConfig = {
      createOrder: () => configRef.current.createOrder(),
      onApprove: (orderId) => configRef.current.onApprove(orderId),
      onCancel: () => configRef.current.onCancel?.(),
      onError: (error) => configRef.current.onError?.(error),
    };

    const mount = async (): Promise<void> => {
      try {
        const rendered = await renderPayPalButtons(container, bridge, controller.signal);
        if (controller.signal.aborted) {
          rendered.close();
          return;
        }
        handle = rendered;
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          configRef.current.onError?.(error);
        }
      }
    };
    void mount();

    // Abort a StrictMode/unmount teardown BEFORE the async render paints, close
    // any rendered instance, and clear the container so no buttons linger.
    return (): void => {
      controller.abort();
      handle?.close();
      container.replaceChildren();
    };
  }, []);

  return { containerRef };
};
