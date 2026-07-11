import type { CreatePaymentOrderResponse } from '@twinzy/shared';
import { CreatePaymentOrderResponseSchema, PAYMENTS_ORDERS_PATH } from '@twinzy/shared';

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
