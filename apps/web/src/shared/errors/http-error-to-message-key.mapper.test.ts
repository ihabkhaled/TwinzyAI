import { describe, expect, it, vi } from 'vitest';

import { mapErrorToMessageKey } from './http-error-to-message-key.mapper';

// The axios package is owned by a sibling wave. Its `isHttpError` guard is
// mocked here so the mapper's branch logic can be exercised in isolation
// without depending on the real HttpError constructor signature. Fake errors
// carry an `__http` marker the mock recognizes.
vi.mock('@/packages/axios', () => ({
  isHttpError: (value: unknown): boolean =>
    typeof value === 'object' && value !== null && '__http' in value,
}));

function httpError(kind: string, status: number | null): unknown {
  return { __http: true, kind, status, responseBody: null };
}

describe('mapErrorToMessageKey', () => {
  it('maps a non-HttpError to generic', () => {
    expect(mapErrorToMessageKey('boom')).toBe('errors.generic');
    expect(mapErrorToMessageKey(null)).toBe('errors.generic');
    expect(mapErrorToMessageKey(new Error('x'))).toBe('errors.generic');
  });

  it('maps kind network/timeout to their own keys', () => {
    expect(mapErrorToMessageKey(httpError('network', null))).toBe('errors.network');
    expect(mapErrorToMessageKey(httpError('timeout', null))).toBe('errors.timeout');
  });

  it('maps a null status to generic', () => {
    expect(mapErrorToMessageKey(httpError('http', null))).toBe('errors.generic');
    expect(mapErrorToMessageKey(httpError('aborted', null))).toBe('errors.generic');
  });

  it('maps 401/403/404 to auth-related keys', () => {
    expect(mapErrorToMessageKey(httpError('http', 401))).toBe('errors.unauthorized');
    expect(mapErrorToMessageKey(httpError('http', 403))).toBe('errors.forbidden');
    expect(mapErrorToMessageKey(httpError('http', 404))).toBe('errors.notFound');
  });

  it('maps 413 to upload', () => {
    expect(mapErrorToMessageKey(httpError('http', 413))).toBe('errors.upload');
  });

  it('maps any 5xx status to server', () => {
    expect(mapErrorToMessageKey(httpError('http', 500))).toBe('errors.server');
    expect(mapErrorToMessageKey(httpError('http', 503))).toBe('errors.server');
  });

  it('maps other statuses to generic', () => {
    expect(mapErrorToMessageKey(httpError('http', 400))).toBe('errors.generic');
    expect(mapErrorToMessageKey(httpError('http', 418))).toBe('errors.generic');
    expect(mapErrorToMessageKey(httpError('unknown', 200))).toBe('errors.generic');
  });
});
