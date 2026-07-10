import { describe, expect, it } from 'vitest';

import { hasSameJsonShape } from '../lib/json-shape.util';

describe('hasSameJsonShape', () => {
  it('allows translated string values with the same nested shape', () => {
    expect(
      hasSameJsonShape(
        { summary: ['one'], nested: { label: 'hello', score: 1 } },
        { summary: ['واحد'], nested: { label: 'مرحبًا', score: 2 } },
      ),
    ).toBe(true);
  });

  it('rejects removed keys and changed array lengths', () => {
    expect(hasSameJsonShape({ nested: { label: 'x' } }, { nested: {} })).toBe(false);
    expect(hasSameJsonShape({ items: ['one'] }, { items: ['one', 'two'] })).toBe(false);
    expect(hasSameJsonShape([], {})).toBe(false);
    expect(hasSameJsonShape({}, 'not-an-object')).toBe(false);
    expect(hasSameJsonShape('one', 1)).toBe(false);
  });
});
