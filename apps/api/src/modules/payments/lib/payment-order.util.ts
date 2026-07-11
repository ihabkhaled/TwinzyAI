import { isRecord } from '@twinzy/shared';

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
