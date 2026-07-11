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
