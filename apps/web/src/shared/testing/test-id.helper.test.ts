import { describe, expect, it } from 'vitest';

import { buildIndexedTestId } from './test-id.helper';

describe('buildIndexedTestId', () => {
  it('joins a base and a numeric suffix with a hyphen', () => {
    expect(buildIndexedTestId('result-card', 2)).toBe('result-card-2');
  });

  it('joins a base and a string suffix with a hyphen', () => {
    expect(buildIndexedTestId('trait-item', 'hair')).toBe('trait-item-hair');
  });

  it('handles a zero index', () => {
    expect(buildIndexedTestId('result-card', 0)).toBe('result-card-0');
  });
});
