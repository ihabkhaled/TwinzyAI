import { z } from 'zod';

import { CorrelationIdSchema } from './game-stream.schema';

/**
 * Cross-side contract of the paid-analysis order endpoint. The client sends
 * only its pre-minted analyze request id (uuid); the PRICE deliberately never
 * appears in this contract — it is server-owned configuration, so a tampered
 * client cannot change what an analysis costs.
 */
export const CreatePaymentOrderRequestSchema = z.strictObject({
  requestId: CorrelationIdSchema,
});

export type CreatePaymentOrderRequest = z.infer<typeof CreatePaymentOrderRequestSchema>;

/** PayPal order ids: short uppercase alphanumerics (server re-validates). */
export const PaypalOrderIdSchema = z.string().regex(/^[A-Z0-9-]{8,64}$/);

export const CreatePaymentOrderResponseSchema = z.strictObject({
  orderId: PaypalOrderIdSchema,
});

export type CreatePaymentOrderResponse = z.infer<typeof CreatePaymentOrderResponseSchema>;

/** Multipart field on the analyze request carrying the approved PayPal order id. */
export const PAYMENT_ORDER_FIELD_NAME = 'paypalOrderId';

/** The payment gateways a run can be paid through. */
export const PaymentGateway = {
  Paypal: 'paypal',
  Paymob: 'paymob',
} as const;

export type PaymentGatewayValue = (typeof PaymentGateway)[keyof typeof PaymentGateway];

export const PaymentGatewaySchema = z.enum([PaymentGateway.Paypal, PaymentGateway.Paymob]);

/**
 * Multipart field on the analyze request naming the gateway that was paid, so
 * the server verifies against the right provider. Absent ⇒ PayPal (back-compat).
 */
export const PAYMENT_GATEWAY_FIELD_NAME = 'paymentGateway';

/** Paymob intention request: only the pre-minted request id; the price is server-owned. */
export const PaymobIntentionRequestSchema = z.strictObject({
  requestId: CorrelationIdSchema,
});

export type PaymobIntentionRequest = z.infer<typeof PaymobIntentionRequestSchema>;

/**
 * Paymob intention response: the `clientSecret` + public key that render the
 * Pixel checkout, the EGP amount actually charged, and the canonical USD base
 * price so the UI can show "it is $1 (≈ N EGP)".
 */
export const PaymobIntentionResponseSchema = z.strictObject({
  clientSecret: z.string().min(1),
  publicKey: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  usdBaseValue: z.string().regex(/^\d{1,6}\.\d{2}$/),
  usdBaseCurrency: z.string().regex(/^[A-Z]{3}$/),
});

export type PaymobIntentionResponse = z.infer<typeof PaymobIntentionResponseSchema>;
