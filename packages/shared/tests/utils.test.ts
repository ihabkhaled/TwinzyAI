import { describe, expect, it } from 'vitest';

import { isRecord } from '../src/utils/guards.util';
import { countPopulatedTraitFields } from '../src/utils/trait-count.util';

describe('isRecord', () => {
  it('is true for a plain object', () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('is false for null, arrays, and primitives', () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([1, 2])).toBe(false);
    expect(isRecord('text')).toBe(false);
    expect(isRecord(42)).toBe(false);
  });
});

describe('countPopulatedTraitFields', () => {
  it('counts observed strings and ignores non-string, notes, and unclear values', () => {
    expect(
      countPopulatedTraitFields({
        hair: { color: 'dark', texture: 'unclear', invalid: 5 },
        eyes: null,
        uncertaintyNotes: { unclearCategories: ['eyes'] },
      }),
    ).toBe(1);
  });
});
