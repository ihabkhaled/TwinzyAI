import { describe, expect, it } from 'vitest';

import arMessages from './messages/ar.json';
import enMessages from './messages/en.json';

/** Flatten a nested message tree into sorted dot-path keys. */
const flattenKeys = (tree: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(tree)
    .flatMap(([key, value]) =>
      typeof value === 'object' && value !== null
        ? flattenKeys(value as Record<string, unknown>, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    )
    .toSorted((left, right) => left.localeCompare(right));

/** ar.json carries a translators' note that has no English counterpart. */
const isTranslatorNote = (key: string): boolean => key.startsWith('_note');

/**
 * Both locales must expose exactly the same message keys: a key added in one
 * file but not the other would render as a raw key (or crash) for half the
 * audience. This guards every namespace, including the content pages.
 */
describe('message catalog parity', () => {
  it('has identical keys in English and Arabic', () => {
    const enKeys = flattenKeys(enMessages);
    const arKeys = flattenKeys(arMessages).filter((key) => !isTranslatorNote(key));

    expect(arKeys).toStrictEqual(enKeys);
  });

  it('has no empty message values in either locale', () => {
    const hasEmpty = (tree: Record<string, unknown>): boolean =>
      Object.values(tree).some((value) =>
        typeof value === 'object' && value !== null
          ? hasEmpty(value as Record<string, unknown>)
          : String(value).trim() === '',
      );

    expect(hasEmpty(enMessages)).toBe(false);
    expect(hasEmpty(arMessages)).toBe(false);
  });
});
