import { AxiosError, type AxiosResponse } from 'axios';

import type { HttpErrorKind } from './http-types';

/**
 * Transport-agnostic error surfaced to the whole app. The vendor `AxiosError`
 * never escapes the axios wrapper: every rejection is normalized to this shape
 * so callers branch on a stable `kind` instead of vendor internals.
 */
export class HttpError extends Error {
  public override readonly name = 'HttpError';
  public readonly kind: HttpErrorKind;
  public readonly status: number | null;
  public readonly responseBody: unknown;

  public constructor(
    kind: HttpErrorKind,
    message: string,
    status: number | null,
    responseBody: unknown,
  ) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function isHttpError(value: unknown): value is HttpError {
  return value instanceof HttpError;
}

function classifyAxiosError(error: AxiosError): HttpErrorKind {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'timeout';
  }

  if (error.code === 'ERR_CANCELED') {
    return 'aborted';
  }

  if (error.response !== undefined) {
    return 'http';
  }

  if (error.request !== undefined) {
    return 'network';
  }

  return 'unknown';
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error';
}

function fromAxiosError(error: AxiosError): HttpError {
  const response: AxiosResponse | undefined = error.response;
  const status = response?.status ?? null;
  const responseBody: unknown = response?.data ?? null;

  return new HttpError(classifyAxiosError(error), error.message, status, responseBody);
}

export function normalizeToHttpError(error: unknown): HttpError {
  if (isHttpError(error)) {
    return error;
  }

  if (error instanceof AxiosError) {
    return fromAxiosError(error);
  }

  return new HttpError('unknown', toErrorMessage(error), null, null);
}
