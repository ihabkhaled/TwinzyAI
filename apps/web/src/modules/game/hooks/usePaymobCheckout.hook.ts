'use client';
// client-boundary-reason: opens the Paymob checkout popup and drives the paid run when it closes.

import type { RefObject } from 'react';
import { useCallback, useState } from 'react';

import { PaymentGateway } from '@twinzy/shared';

import { awaitPaymobPopupClosed, openPaymobPopup, startPaymobCheckout } from '@/packages/paymob';

import { createPaymobIntentionRequest } from '../gateway/payment.gateway';
import type {
  PaymentFlowDeps,
  PaymobCheckoutController,
  PendingRun,
} from '../model/payment-flow.types';

/**
 * Owns the Paymob card checkout: opens a popup synchronously (dodging the popup
 * blocker), creates the server-priced intention for the SHARED request id, points
 * the popup at Paymob's hosted checkout, and — once the popup closes — starts the
 * paid run tagged `paymob`. Completion is not trusted here; the backend verifies
 * the payment with Paymob at consumption.
 */
export const usePaymobCheckout = (
  beginRun: PaymentFlowDeps['beginRun'],
  requestIdRef: RefObject<string | undefined>,
  pendingRef: RefObject<PendingRun | undefined>,
  onSettled: () => void,
  onError: () => void,
): PaymobCheckoutController => {
  const [isPaymobPending, setIsPaymobPending] = useState(false);

  const payWithPaymob = useCallback((): void => {
    const requestId = requestIdRef.current;
    const pending = pendingRef.current;
    if (requestId === undefined || pending === undefined) {
      return;
    }
    const popup = openPaymobPopup();
    if (popup === null) {
      onError();
      return;
    }
    setIsPaymobPending(true);
    const run = async (): Promise<void> => {
      try {
        const { clientSecret, publicKey } = await createPaymobIntentionRequest(requestId);
        startPaymobCheckout(popup, publicKey, clientSecret);
        await awaitPaymobPopupClosed(popup);
        // cancelPayment clears the request id; skip the run if it was cancelled
        // while the popup was open.
        if (requestIdRef.current !== requestId) {
          return;
        }
        onSettled();
        beginRun(pending.file, pending.resultCount, {
          requestId,
          paymentGateway: PaymentGateway.Paymob,
        });
      } catch {
        popup.close();
        onError();
      } finally {
        setIsPaymobPending(false);
      }
    };
    void run();
  }, [beginRun, requestIdRef, pendingRef, onSettled, onError]);

  return { isPaymobPending, payWithPaymob };
};
