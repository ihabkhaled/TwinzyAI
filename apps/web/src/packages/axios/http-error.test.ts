import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import { HttpError, isHttpError, normalizeToHttpError } from './http-error';

function axiosWithCode(code: string): AxiosError {
  return new AxiosError('boom', code);
}

function axiosWithResponse(status: number, data: unknown): AxiosError {
  const error = new AxiosError('http failure', 'ERR_BAD_RESPONSE');
  error.response = { status, data } as unknown as AxiosResponse;

  return error;
}

function axiosNetwork(): AxiosError {
  const error = new AxiosError('network down', 'ERR_NETWORK');
  error.request = {};

  return error;
}

describe('normalizeToHttpError', () => {
  it('passes through an existing HttpError unchanged', () => {
    const original = new HttpError('http', 'boom', 500, { detail: 'x' });

    expect(normalizeToHttpError(original)).toBe(original);
  });

  it.each([
    ['ECONNABORTED', 'timeout'],
    ['ETIMEDOUT', 'timeout'],
    ['ERR_CANCELED', 'aborted'],
  ])('classifies axios code %s as %s', (code, kind) => {
    expect(normalizeToHttpError(axiosWithCode(code)).kind).toBe(kind);
  });

  it('classifies an axios error with a response as http and copies status/body', () => {
    const result = normalizeToHttpError(axiosWithResponse(404, { message: 'nope' }));

    expect(result.kind).toBe('http');
    expect(result.status).toBe(404);
    expect(result.responseBody).toStrictEqual({ message: 'nope' });
  });

  it('classifies an axios error with only a request as network', () => {
    const result = normalizeToHttpError(axiosNetwork());

    expect(result.kind).toBe('network');
    expect(result.status).toBeNull();
  });

  it('classifies a bare axios error as unknown', () => {
    expect(normalizeToHttpError(new AxiosError('weird')).kind).toBe('unknown');
  });

  it('wraps a non-axios error as unknown and copies its message', () => {
    const result = normalizeToHttpError(new Error('plain failure'));

    expect(result.kind).toBe('unknown');
    expect(result.message).toBe('plain failure');
    expect(result.status).toBeNull();
    expect(result.responseBody).toBeNull();
  });

  it('wraps a non-error value with a fallback message', () => {
    expect(normalizeToHttpError('just a string').message).toBe('Unexpected error');
  });
});

describe('isHttpError', () => {
  it('returns true for HttpError instances', () => {
    expect(isHttpError(new HttpError('unknown', 'x', null, null))).toBe(true);
  });

  it('returns false for other values', () => {
    expect(isHttpError(new Error('x'))).toBe(false);
    expect(isHttpError('nope')).toBe(false);
  });
});
