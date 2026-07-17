import type { CreatePaymentOrderResponse, PaymobIntentionResponse } from '@twinzy/shared';
import {
  CreatePaymentOrderResponseSchema,
  PAYMENTS_ORDERS_PATH,
  PAYMENTS_PAYMOB_INTENTION_PATH,
  PaymobIntentionResponseSchema,
} from '@twinzy/shared';

import { httpClient, postJson } from '@/packages/axios';

/**
 * HTTP only: asks the backend to create a server-priced PayPal order bound to
 * the given analyze request id, and validates the response against the shared
 * contract. The price is never sent — it is server-authoritative.
 */
export const createPaymentOrderRequest = async (
  requestId: string,
): Promise<CreatePaymentOrderResponse> =>
  postJson(httpClient, PAYMENTS_ORDERS_PATH, { requestId }, CreatePaymentOrderResponseSchema);

/**
 * HTTP only: asks the backend to create a server-priced Paymob intention bound
 * to the given request id (charged in EGP, converted from the canonical USD
 * price). Returns the client secret + public key the popup checkout needs.
 */
export const createPaymobIntentionRequest = async (
  requestId: string,
): Promise<PaymobIntentionResponse> =>
  postJson(
    httpClient,
    PAYMENTS_PAYMOB_INTENTION_PATH,
    { requestId },
    PaymobIntentionResponseSchema,
  );
