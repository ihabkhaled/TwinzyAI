'use client';
// client-boundary-reason: renders the PayPal Buttons SDK into a DOM node and owns its mount/teardown lifecycle, which exist only in the browser.

import { useEffect, useRef, useState } from 'react';

import type { PayPalButtonsConfig, PayPalButtonsHandle } from '@/packages/paypal';
import { renderPayPalButtons } from '@/packages/paypal';

import type { PayPalButtonsController, PayPalButtonsStatusValue } from '../model/payment.types';
import { PayPalButtonsStatus } from '../model/payment.types';

/**
 * Mounts the PayPal buttons into a returned ref once, tears them down on
 * unmount, and exposes a `status` (loading → ready, or error) so the step can
 * show a loader until the SDK has painted them. The config callbacks are read
 * from a ref so re-renders never re-mount the buttons.
 */
export const usePayPalButtons = (config: PayPalButtonsConfig): PayPalButtonsController => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const [status, setStatus] = useState<PayPalButtonsStatusValue>(PayPalButtonsStatus.Loading);

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
        setStatus(PayPalButtonsStatus.Ready);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setStatus(PayPalButtonsStatus.Error);
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

  return { containerRef, status };
};
