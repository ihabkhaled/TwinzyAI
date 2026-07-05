import type { z } from 'zod';

import { isRecord } from '@twinzy/shared';

import { getApiBaseUrl } from '../config/public-env';

import { HttpClientError, INVALID_RESPONSE_CODE, NETWORK_ERROR_CODE } from './http-error';

/**
 * The only file in the web app allowed to call fetch. Gateways use this
 * wrapper; responses are Zod-validated before they leave the transport
 * layer, so no unvalidated backend data crosses into the app.
 */
export const postMultipart = async <TSchema extends z.ZodType>(
  path: string,
  formData: FormData,
  schema: TSchema,
): Promise<z.infer<TSchema>> => {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new HttpClientError(0, NETWORK_ERROR_CODE, 'Network request failed');
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw toHttpError(response.status, payload);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new HttpClientError(
      response.status,
      INVALID_RESPONSE_CODE,
      'Response shape did not match the expected schema',
    );
  }

  return parsed.data;
};

const toHttpError = (status: number, payload: unknown): HttpClientError => {
  if (isRecord(payload) && typeof payload['errorCode'] === 'string') {
    const message = typeof payload['message'] === 'string' ? payload['message'] : '';
    return new HttpClientError(status, payload['errorCode'], message);
  }
  return new HttpClientError(status, INVALID_RESPONSE_CODE, 'Unexpected error response');
};
