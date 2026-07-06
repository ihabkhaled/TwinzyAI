import { describe, expect, it } from 'vitest';

import { buttonVariants } from './button.variants';

describe('buttonVariants', () => {
  it('applies the primary + md defaults', () => {
    const result = buttonVariants();

    expect(result).toContain('bg-primary');
    expect(result).toContain('text-primary-foreground');
    expect(result).toContain('h-11');
  });

  it.each([
    ['primary', 'bg-primary'],
    ['secondary', 'bg-surface'],
    ['danger', 'bg-danger'],
    ['ghost', 'bg-transparent'],
  ] as const)('maps the %s variant to its surface class', (variant, expected) => {
    expect(buttonVariants({ variant })).toContain(expected);
  });

  it.each([
    ['sm', 'h-9'],
    ['md', 'h-11'],
    ['lg', 'h-12'],
  ] as const)('maps the %s size to its height class', (size, expected) => {
    expect(buttonVariants({ size })).toContain(expected);
  });
});
