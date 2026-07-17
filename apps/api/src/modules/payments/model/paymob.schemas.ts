import { z } from 'zod';

/**
 * Zod views of the Paymob Accept responses the adapter reads. Each requires ONLY
 * the fields we act on and ignores the rest, so a provider adding fields never
 * breaks parsing. Every response is validated before any value is trusted.
 */

/** POST /v1/intention/ → the client_secret that renders the Pixel checkout. */
export const PaymobIntentionApiResponseSchema = z.object({
  client_secret: z.string().min(1),
});

/** POST /api/auth/tokens → the auth token used by inquiry/refund calls. */
export const PaymobAuthTokenResponseSchema = z.object({
  token: z.string().min(1),
});

/**
 * A Paymob transaction as returned by the transaction inquiry. `order.merchant_order_id`
 * echoes the `special_reference` we set at intention time (our request id).
 */
export const PaymobTransactionSchema = z.object({
  id: z.number(),
  success: z.boolean(),
  pending: z.boolean(),
  is_refunded: z.boolean(),
  is_voided: z.boolean(),
  error_occured: z.boolean().nullish(),
  amount_cents: z.coerce.number(),
  currency: z.string(),
  order: z.object({
    id: z.number(),
    merchant_order_id: z.string().nullish(),
  }),
  // Decline diagnostics only. z.object() STRIPS every other key, so card data
  // (masked pan, holder, source_data) never enters our parsed object at all.
  data: z
    .object({
      message: z.string().nullish(),
      txn_response_code: z.string().nullish(),
    })
    .nullish(),
});
