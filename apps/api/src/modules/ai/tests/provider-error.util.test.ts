import { describe, expect, it } from 'vitest';

import {
  classifyProviderError,
  isModelRetryable,
  ProviderErrorKind,
} from '../lib/provider-error.util';

describe('classifyProviderError', () => {
  it('classifies a 429 status as rate-limited', () => {
    expect(classifyProviderError({ status: 429 })).toBe(ProviderErrorKind.RateLimited);
  });

  it('classifies a quota-exceeded message as rate-limited', () => {
    const error = new Error(
      'You exceeded your current quota. { "error": { "code": 429, "status": "RESOURCE_EXHAUSTED" } }',
    );
    expect(classifyProviderError(error)).toBe(ProviderErrorKind.RateLimited);
  });

  it('reads an embedded "code": 429 from the message when no status field exists', () => {
    expect(classifyProviderError(new Error('{ "code": 429 }'))).toBe(ProviderErrorKind.RateLimited);
  });

  it('classifies a 503/overloaded error as unavailable', () => {
    expect(classifyProviderError({ status: 503 })).toBe(ProviderErrorKind.Unavailable);
    expect(classifyProviderError(new Error('The model is overloaded'))).toBe(
      ProviderErrorKind.Unavailable,
    );
  });

  it('classifies a model-not-found error as unavailable (so the next model is tried)', () => {
    expect(classifyProviderError(new Error('models/foo is not found'))).toBe(
      ProviderErrorKind.Unavailable,
    );
    expect(classifyProviderError({ status: 404 })).toBe(ProviderErrorKind.Unavailable);
  });

  it('classifies an unrecognized error as fatal', () => {
    expect(classifyProviderError(new Error('malformed request'))).toBe(ProviderErrorKind.Fatal);
    expect(classifyProviderError('weird')).toBe(ProviderErrorKind.Fatal);
  });
});

describe('isModelRetryable', () => {
  it('retries rate-limited and unavailable, not fatal', () => {
    expect(isModelRetryable(ProviderErrorKind.RateLimited)).toBe(true);
    expect(isModelRetryable(ProviderErrorKind.Unavailable)).toBe(true);
    expect(isModelRetryable(ProviderErrorKind.Fatal)).toBe(false);
  });
});
