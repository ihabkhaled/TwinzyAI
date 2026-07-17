import type { PaymentGatewayValue } from '@twinzy/shared';
import {
  isRecord,
  PAYMENT_GATEWAY_FIELD_NAME,
  PaymentGateway,
  PaymentGatewaySchema,
  PAYMOB_ID_PATTERN,
  PAYMOB_ORDER_FIELD_NAME,
  PAYMOB_TRANSACTION_FIELD_NAME,
} from '@twinzy/shared';

import { PAYMENT_ORDER_FIELD_NAME, PAYPAL_ORDER_ID_PATTERN } from '../model/payment.constants';

/**
 * Read the PayPal order id off the multipart analyze body.
 * - `undefined` → the field is absent (client did not attempt payment);
 * - `null` → present but malformed (rejected before it can reach the adapter);
 * - `string` → a syntactically valid order id, safe to send to PayPal.
 */
export const resolvePaymentOrderId = (body: unknown): string | null | undefined => {
  if (!isRecord(body)) {
    return undefined;
  }
  const raw = body[PAYMENT_ORDER_FIELD_NAME];
  if (raw === undefined) {
    return undefined;
  }
  return typeof raw === 'string' && PAYPAL_ORDER_ID_PATTERN.test(raw) ? raw : null;
};

/**
 * Read which gateway the client paid through off the analyze body. Absent or
 * malformed ⇒ PayPal (back-compat with the single-gateway contract).
 */
export const resolvePaymentGateway = (body: unknown): PaymentGatewayValue => {
  if (!isRecord(body)) {
    return PaymentGateway.Paypal;
  }
  const parsed = PaymentGatewaySchema.safeParse(body[PAYMENT_GATEWAY_FIELD_NAME]);
  return parsed.success ? parsed.data : PaymentGateway.Paypal;
};

/**
 * Read the paid Paymob order id off the multipart body (numeric).
 * - `undefined` → absent (no payment attempted);
 * - `null` → present but malformed;
 * - `number` → a valid order id to verify.
 */
export const resolvePaymobOrderId = (body: unknown): number | null | undefined => {
  if (!isRecord(body)) {
    return undefined;
  }
  const raw = body[PAYMOB_ORDER_FIELD_NAME];
  if (raw === undefined) {
    return undefined;
  }
  return typeof raw === 'string' && PAYMOB_ID_PATTERN.test(raw) ? Number(raw) : null;
};

/** Read the Paymob transaction id off the body (optional; only used to refund). */
export const resolvePaymobTransactionId = (body: unknown): number | undefined => {
  if (!isRecord(body)) {
    return undefined;
  }
  const raw = body[PAYMOB_TRANSACTION_FIELD_NAME];
  return typeof raw === 'string' && PAYMOB_ID_PATTERN.test(raw) ? Number(raw) : undefined;
};
