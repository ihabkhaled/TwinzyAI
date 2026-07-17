import { useCallback, useEffect, useRef } from 'react';

import { newRequestId } from '../helpers/stream-identity.helper';
import type { AnalyzeRunControl, AnalyzeRunInput, AnalyzeRunPayment } from '../model/game.types';

/**
 * Owns the per-run AbortController for the streaming analyze mutation. `beginRun`
 * aborts any previous run before starting a new one (so a tab never has two live
 * runs); `cancelRun` aborts the in-flight run, and the same abort fires on
 * unmount (route change / tab close). Aborting closes the SSE socket, which the
 * backend treats as a disconnect and uses to stop the pipeline and free the slot.
 */
export const useAnalyzeRunControl = (
  start: (input: AnalyzeRunInput) => void,
): AnalyzeRunControl => {
  const controllerRef = useRef<AbortController | null>(null);

  const cancelRun = useCallback((): void => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const beginRun = useCallback(
    (file: File, resultCount: number, payment?: AnalyzeRunPayment): void => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      start({
        file,
        requestId: payment?.requestId ?? newRequestId(),
        signal: controller.signal,
        resultCount,
        ...(payment?.paymentGateway !== undefined && { paymentGateway: payment.paymentGateway }),
        ...(payment?.paypalOrderId !== undefined && { paypalOrderId: payment.paypalOrderId }),
        ...(payment?.paymobOrderId !== undefined && { paymobOrderId: payment.paymobOrderId }),
        ...(payment?.paymobTransactionId !== undefined && {
          paymobTransactionId: payment.paymobTransactionId,
        }),
      });
    },
    [start],
  );

  useEffect(() => cancelRun, [cancelRun]);

  return { beginRun, cancelRun };
};
