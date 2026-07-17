/**
 * Proof that money moved for exactly one analysis run, tagged by gateway so the
 * refund-on-failure path calls the right provider. Held only for the lifetime of
 * the request; never persisted.
 */
interface PaypalCaptureRecord {
  readonly gateway: 'paypal';
  readonly orderId: string;
  readonly captureId: string;
}

export interface PaymobCaptureRecord {
  readonly gateway: 'paymob';
  readonly transactionId: number;
  readonly amountCents: number;
}

export type PaymentCaptureRecord = PaypalCaptureRecord | PaymobCaptureRecord;

/** What a freshly-created Paymob intention hands back to the client for Pixel checkout. */
export interface PaymobIntention {
  readonly clientSecret: string;
  readonly amountCents: number;
  readonly currency: string;
}

/**
 * Mutable per-run payment slot threaded through the analyze pipeline so the
 * refund-on-failure handler can see a capture made deeper in the flow.
 * `undefined` = paywall off or capture not reached.
 */
export interface PaymentHolder {
  capture: PaymentCaptureRecord | undefined;
}
