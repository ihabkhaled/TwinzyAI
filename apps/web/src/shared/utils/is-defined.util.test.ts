import { describe, expect, it } from 'vitest';

import { isDefined } from './is-defined.util';

describe('isDefined', () => {
  it('returns false for null', () => {
    expect(isDefined(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    const value: string | undefined = undefined;

    expect(isDefined(value)).toBe(false);
  });

  it('returns true for falsy-but-defined values (0, empty string, false)', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
  });

  it('returns true for objects and arrays', () => {
    expect(isDefined({})).toBe(true);
    expect(isDefined([])).toBe(true);
  });

  it('narrows a mixed array down to defined values only', () => {
    const mixed: (number | null | undefined)[] = [1, null, 2, undefined, 3];

    expect(mixed.filter((value): value is number => isDefined(value))).toStrictEqual([1, 2, 3]);
  });
});
