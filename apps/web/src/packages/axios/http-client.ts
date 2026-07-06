import axios, { type AxiosInstance } from 'axios';

import { publicEnv } from '@/packages/env';
import { parseSchema, type z } from '@/packages/zod';

import { normalizeToHttpError } from './http-error';
import type { HttpRequestConfig } from './http-types';

/**
 * The single owner of the `axios` vendor. Every instance carries a shared
 * timeout and base URL, and a response interceptor that rethrows the vendor
 * error as our normalized `HttpError`, so no `AxiosError` ever leaks past this
 * boundary.
 */
export function createHttpClient(config?: HttpRequestConfig): AxiosInstance {
  const client = axios.create({
    timeout: 15_000,
    baseURL: publicEnv.apiBaseUrl,
    ...config,
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown): never => {
      throw normalizeToHttpError(error);
    },
  );

  return client;
}

export const httpClient: AxiosInstance = createHttpClient();

/**
 * Posts a `FormData` body and validates the JSON response against `schema`.
 * This maps the game's image-upload flow onto the shared client while keeping
 * the response contract enforced by zod.
 */
export async function postMultipart<TSchema extends z.ZodType>(
  client: AxiosInstance,
  path: string,
  formData: FormData,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const response = await client.post<unknown>(path, formData);

  return parseSchema(schema, response.data, path);
}
