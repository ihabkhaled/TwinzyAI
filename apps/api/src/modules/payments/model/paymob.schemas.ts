import { z } from 'zod';

/**
 * Zod views of the Paymob Accept responses the adapter reads. Each requires ONLY
 * the fields we act on and ignores the rest, so a provider adding fields never
 * breaks parsing. Every response is validated before any value is trusted.
 */

/** POST /v1/intention/ → the client_secret + the order id we verify against later. */
export const PaymobIntentionApiResponseSchema = z.object({
  client_secret: z.string().min(1),
  intention_order_id: z.coerce.number(),
});

/** POST /api/auth/tokens → the auth token used by inquiry/refund calls. */
export const PaymobAuthTokenResponseSchema = z.object({
  token: z.string().min(1),
});

/**
 * A Paymob order as returned by GET /api/ecommerce/orders/{id}. `merchant_order_id`
 * echoes the `special_reference` we set at intention time (our request id), and
 * `payment_status` becomes `PAID` once the full amount is captured. No card data
 * is declared, so z.object() strips masked pan / holder / source_data entirely.
 */
export const PaymobOrderSchema = z.object({
  id: z.number(),
  merchant_order_id: z.string().nullish(),
  amount_cents: z.coerce.number(),
  paid_amount_cents: z.coerce.number(),
  currency: z.string(),
  payment_status: z.string().nullish(),
  is_canceled: z.boolean().nullish(),
  is_returned: z.boolean().nullish(),
});
