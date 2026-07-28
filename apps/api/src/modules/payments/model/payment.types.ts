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

/** A PayPal order proven ready for capture, without money having moved yet. */
export interface PaypalPreparedPayment {
  readonly gateway: 'paypal';
  readonly orderId: string;
  readonly expectedRequestId: string | undefined;
}

export interface PaymobCaptureRecord {
  readonly gateway: 'paymob';
  readonly orderId: number;
  /** From the checkout redirect; needed to refund. Absent if the buyer closed early. */
  readonly transactionId: number | undefined;
  readonly amountCents: number;
}

export type PaymentCaptureRecord = PaypalCaptureRecord | PaymobCaptureRecord;
export type PaymentPreparationRecord = PaypalPreparedPayment | PaymobCaptureRecord;

/** What a freshly-created Paymob intention hands back to the client for checkout. */
export interface PaymobIntention {
  readonly clientSecret: string;
  /** The Paymob order id, verified against at consumption. */
  readonly orderId: number;
  readonly amountCents: number;
  readonly currency: string;
}

/**
 * Mutable per-run payment slots threaded through the analyze pipeline.
 * Preparation proves eligibility; capture is populated only when money moves,
 * so refund-on-failure never compensates an approved-but-uncaptured order.
 */
export interface PaymentHolder {
  prepared: PaymentPreparationRecord | undefined;
  capture: PaymentCaptureRecord | undefined;
}
