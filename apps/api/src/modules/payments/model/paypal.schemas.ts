import { z } from 'zod';

/**
 * Lenient zod views of the PayPal REST responses: only the fields the gate
 * decides on are validated; everything else is ignored. Parsing failure ⇒ the
 * response is treated as a provider failure, never trusted partially.
 */

export const PaypalTokenResponseSchema = z.looseObject({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
});

export const PaypalCreateOrderResponseSchema = z.looseObject({
  id: z.string().min(1),
  status: z.string().min(1),
});

const captureAmountSchema = z.looseObject({
  currency_code: z.string().min(1),
  value: z.string().min(1),
});

const captureSchema = z.looseObject({
  id: z.string().min(1),
  status: z.string().min(1),
  amount: captureAmountSchema,
  custom_id: z.string().optional(),
});

const capturesContainerSchema = z.looseObject({
  captures: z.array(captureSchema).optional(),
});

const purchaseUnitSchema = z.looseObject({
  payments: capturesContainerSchema.optional(),
});

export const PaypalCaptureOrderResponseSchema = z.looseObject({
  id: z.string().min(1),
  status: z.string().min(1),
  purchase_units: z.array(purchaseUnitSchema).min(1),
});

export type PaypalCaptureOrderResponse = z.output<typeof PaypalCaptureOrderResponseSchema>;

const paypalErrorDetailSchema = z.looseObject({ issue: z.string().optional() });

/** PayPal error bodies carry machine-readable `issue` codes under details. */
export const PaypalErrorResponseSchema = z.looseObject({
  details: z.array(paypalErrorDetailSchema).optional(),
});
