import { describe, expect, it } from 'vitest';

import { stackVariants } from './stack.variants';

describe('stackVariants', () => {
  it('defaults to a vertical stack with medium gap', () => {
    const result = stackVariants();

    expect(result).toContain('flex-col');
    expect(result).toContain('gap-4');
  });

  it('honours direction, gap, align, justify and wrap', () => {
    const result = stackVariants({
      direction: 'row',
      gap: 'lg',
      align: 'center',
      justify: 'between',
      wrap: 'wrap',
    });

    expect(result).toContain('flex-row');
    expect(result).toContain('gap-6');
    expect(result).toContain('items-center');
    expect(result).toContain('justify-between');
    expect(result).toContain('flex-wrap');
  });
});
