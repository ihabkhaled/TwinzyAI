'use client';
// client-boundary-reason: owns the paid-analysis run id, order creation, and approval callbacks around the analyze mutation's browser state.

import { useCallback, useRef, useState } from 'react';

import { isPayPalConfigured } from '@/packages/paypal';
import { ERROR_MESSAGE_KEYS, type ErrorMessageKey } from '@/shared/errors/error-keys.constants';

import { createPaymentOrderRequest } from '../gateway/payment.gateway';
import { newRequestId } from '../helpers/stream-identity.helper';
import type { PaymentFlowController, PaymentFlowDeps } from '../model/payment-flow.types';

/**
 * Bridges the paid-analysis payment step to the analyze run. When the paywall
 * is off, `beginPaidRun` starts the free run directly. When on, it enters the
 * payment phase with a freshly-minted request id, creates the server-priced
 * order bound to that id, and — on buyer approval — starts the analyze run with
 * the same id + approved order id so the backend captures at consumption.
 */
export const usePaymentFlow = (deps: PaymentFlowDeps): PaymentFlowController => {
  const [isPaying, setIsPaying] = useState(false);
  const [errorKey, setErrorKey] = useState<ErrorMessageKey | undefined>();
  const requestIdRef = useRef<string | undefined>(undefined);
  const pendingRef = useRef<{ file: File; resultCount: number } | undefined>(undefined);

  const beginPaidRun = useCallback(
    (file: File, resultCount: number): void => {
      setErrorKey(undefined);
      if (!isPayPalConfigured()) {
        deps.beginRun(file, resultCount);
        return;
      }
      requestIdRef.current = newRequestId();
      pendingRef.current = { file, resultCount };
      setIsPaying(true);
    },
    [deps],
  );

  const onError = useCallback((): void => {
    setErrorKey(ERROR_MESSAGE_KEYS.payment);
  }, []);

  const createOrder = useCallback(async (): Promise<string> => {
    const requestId = requestIdRef.current;
    if (requestId === undefined) {
      throw new Error('No active payment request.');
    }
    const { orderId } = await createPaymentOrderRequest(requestId);
    return orderId;
  }, []);

  const onApprove = useCallback(
    (orderId: string): void => {
      const requestId = requestIdRef.current;
      const pending = pendingRef.current;
      if (requestId === undefined || pending === undefined) {
        return;
      }
      setIsPaying(false);
      deps.beginRun(pending.file, pending.resultCount, { requestId, paypalOrderId: orderId });
    },
    [deps],
  );

  const cancelPayment = useCallback((): void => {
    setIsPaying(false);
    requestIdRef.current = undefined;
    pendingRef.current = undefined;
  }, []);

  return {
    isPaywallEnabled: isPayPalConfigured(),
    isPaying,
    errorKey,
    beginPaidRun,
    createOrder,
    onApprove,
    onError,
    cancelPayment,
  };
};
