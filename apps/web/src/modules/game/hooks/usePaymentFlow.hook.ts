'use client';
// client-boundary-reason: owns the paid-analysis run id, order/intention creation, and approval callbacks around the analyze mutation's browser state.

import { useCallback, useRef, useState } from 'react';

import { PaymentGateway } from '@twinzy/shared';

import { isPaymobConfigured } from '@/packages/paymob';
import { isPayPalConfigured } from '@/packages/paypal';
import { ERROR_MESSAGE_KEYS, type ErrorMessageKey } from '@/shared/errors/error-keys.constants';

import { createPaymentOrderRequest } from '../gateway/payment.gateway';
import { newRequestId } from '../helpers/stream-identity.helper';
import type {
  PaymentFlowController,
  PaymentFlowDeps,
  PendingRun,
} from '../model/payment-flow.types';

import { usePaymobCheckout } from './usePaymobCheckout.hook';

/**
 * Bridges the paid-analysis payment step to the analyze run across both gateways.
 * When no gateway is configured, `beginPaidRun` starts the free run directly.
 * Otherwise it enters the payment phase with a freshly-minted request id (shared
 * by BOTH gateways) and, on PayPal approval or Paymob completion, starts the run
 * with that same id so the backend verifies at consumption.
 */
export const usePaymentFlow = (deps: PaymentFlowDeps): PaymentFlowController => {
  const [isPaying, setIsPaying] = useState(false);
  const [errorKey, setErrorKey] = useState<ErrorMessageKey | undefined>();
  const requestIdRef = useRef<string | undefined>(undefined);
  const pendingRef = useRef<PendingRun | undefined>(undefined);

  const onError = useCallback((): void => {
    setErrorKey(ERROR_MESSAGE_KEYS.payment);
  }, []);
  const settlePayment = useCallback((): void => {
    setIsPaying(false);
  }, []);

  const { isPaymobPending, payWithPaymob } = usePaymobCheckout(
    deps.beginRun,
    requestIdRef,
    pendingRef,
    settlePayment,
    onError,
  );

  const beginPaidRun = useCallback(
    (file: File, resultCount: number): void => {
      setErrorKey(undefined);
      if (!isPayPalConfigured() && !isPaymobConfigured()) {
        deps.beginRun(file, resultCount);
        return;
      }
      requestIdRef.current = newRequestId();
      pendingRef.current = { file, resultCount };
      setIsPaying(true);
    },
    [deps],
  );

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
      deps.beginRun(pending.file, pending.resultCount, {
        requestId,
        paymentGateway: PaymentGateway.Paypal,
        paypalOrderId: orderId,
      });
    },
    [deps],
  );

  const cancelPayment = useCallback((): void => {
    setIsPaying(false);
    requestIdRef.current = undefined;
    pendingRef.current = undefined;
  }, []);

  return {
    isPaywallEnabled: isPayPalConfigured() || isPaymobConfigured(),
    isPaypalEnabled: isPayPalConfigured(),
    isPaymobEnabled: isPaymobConfigured(),
    isPaying,
    isPaymobPending,
    errorKey,
    beginPaidRun,
    createOrder,
    onApprove,
    payWithPaymob,
    onError,
    cancelPayment,
  };
};
