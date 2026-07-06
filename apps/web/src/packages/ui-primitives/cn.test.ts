import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('joins truthy class names and drops falsy ones', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('deduplicates conflicting tailwind utilities, keeping the last', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('resolves conditional objects and arrays', () => {
    expect(cn(['text-foreground', { hidden: false, flex: true }])).toBe('text-foreground flex');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, null)).toBe('');
  });
});
