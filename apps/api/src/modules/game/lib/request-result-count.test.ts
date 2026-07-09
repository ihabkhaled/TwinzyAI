import { describe, expect, it } from 'vitest';

import { DEFAULT_RESULT_COUNT, MAX_RESULT_COUNT, MIN_RESULT_COUNT } from '@twinzy/shared';

import { resolveRequestResultCount } from './request-result-count';

describe('resolveRequestResultCount', () => {
  it('coerces a valid multipart string count to the number', () => {
    expect(resolveRequestResultCount({ resultCount: '5' })).toBe(5);
  });

  it('accepts a numeric count from a JSON client', () => {
    expect(resolveRequestResultCount({ resultCount: MIN_RESULT_COUNT })).toBe(MIN_RESULT_COUNT);
    expect(resolveRequestResultCount({ resultCount: MAX_RESULT_COUNT })).toBe(MAX_RESULT_COUNT);
  });

  it('defaults when the count is absent', () => {
    expect(resolveRequestResultCount({})).toBe(DEFAULT_RESULT_COUNT);
  });

  it('falls back to the default for an out-of-range count (parse fails)', () => {
    expect(resolveRequestResultCount({ resultCount: '99' })).toBe(DEFAULT_RESULT_COUNT);
    expect(resolveRequestResultCount({ resultCount: 0 })).toBe(DEFAULT_RESULT_COUNT);
  });

  it('falls back to the default for a non-numeric or non-object body', () => {
    expect(resolveRequestResultCount({ resultCount: 'not-a-number' })).toBe(DEFAULT_RESULT_COUNT);
    expect(resolveRequestResultCount(null)).toBe(DEFAULT_RESULT_COUNT);
    expect(resolveRequestResultCount('nonsense')).toBe(DEFAULT_RESULT_COUNT);
  });
});
