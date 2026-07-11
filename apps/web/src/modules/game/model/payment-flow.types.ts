import type { ErrorMessageKey } from '@/shared/errors/error-keys.constants';

import type { AnalyzeRunPayment } from './game.types';

/** What the payment flow needs from the analyze run control. */
export interface PaymentFlowDeps {
  beginRun: (file: File, resultCount: number, payment?: AnalyzeRunPayment) => void;
}

/** The payment flow surface the game hook composes into its view model. */
export interface PaymentFlowController {
  isPaywallEnabled: boolean;
  isPaying: boolean;
  /** Recoverable order/approval failure key, or undefined. */
  errorKey: ErrorMessageKey | undefined;
  /** Start a run: free directly, or (paywall on) enter the payment phase. */
  beginPaidRun: (file: File, resultCount: number) => void;
  /** Buttons SDK callback: create the server-priced order for the run. */
  createOrder: () => Promise<string>;
  /** Buttons SDK callback: buyer approved — start the paid analyze run. */
  onApprove: (orderId: string) => void;
  /** Buttons SDK callback: order/approval failed (records the error key). */
  onError: () => void;
  /** Leave the payment phase without paying. */
  cancelPayment: () => void;
}
