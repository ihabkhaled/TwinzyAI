/**
 * Proof that money moved for exactly one analysis run: the captured PayPal
 * order + capture ids. Held only for the lifetime of the request (used to
 * refund if the pipeline fails after capture); never persisted.
 */
export interface PaymentCaptureRecord {
  readonly orderId: string;
  readonly captureId: string;
}

/**
 * Mutable per-run payment slot threaded through the analyze pipeline so the
 * refund-on-failure handler can see a capture made deeper in the flow.
 * `undefined` = paywall off or capture not reached.
 */
export interface PaymentHolder {
  capture: PaymentCaptureRecord | undefined;
}
