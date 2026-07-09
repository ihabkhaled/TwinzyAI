import { describe, expect, it } from 'vitest';

import { isNonEmptyString, isRecord } from '../src/utils/guards.util';
import { clamp } from '../src/utils/number.util';

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

describe('isNonEmptyString', () => {
  it('is true for a string with non-whitespace content', () => {
    expect(isNonEmptyString('hi')).toBe(true);
  });

  it('is false for empty, whitespace-only, or non-string values', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString(' '.repeat(3))).toBe(false);
    expect(isNonEmptyString(7)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
  });
});

describe('clamp', () => {
  it('returns the value when it sits within the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps below the minimum and above the maximum', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});
