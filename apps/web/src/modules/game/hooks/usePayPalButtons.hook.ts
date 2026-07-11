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
    let handle: PayPalButtonsHandle | undefined;
    let cancelled = false;

    const bridge: PayPalButtonsConfig = {
      createOrder: () => configRef.current.createOrder(),
      onApprove: (orderId) => configRef.current.onApprove(orderId),
      onCancel: () => configRef.current.onCancel?.(),
      onError: (error) => configRef.current.onError?.(error),
    };

    const mount = async (): Promise<void> => {
      try {
        const rendered = await renderPayPalButtons(container, bridge);
        if (cancelled) {
          rendered.close();
          return;
        }
        handle = rendered;
      } catch (error: unknown) {
        configRef.current.onError?.(error);
      }
    };
    void mount();

    return (): void => {
      cancelled = true;
      handle?.close();
    };
  }, []);

  return { containerRef };
};
