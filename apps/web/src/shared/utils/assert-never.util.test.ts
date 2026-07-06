import { describe, expect, it } from 'vitest';

import { assertNever } from './assert-never.util';

describe('assertNever', () => {
  it('throws, including the stringified unexpected value', () => {
    // Cast through unknown: at runtime an unhandled union member can reach here
    // even though the type system says it cannot.
    const rogue = 'unhandled' as unknown as never;

    expect(() => assertNever(rogue)).toThrow('Unexpected value: unhandled');
  });
});
