import { describe, expect, it } from 'vitest';

import arMessages from './messages/ar.json';
import deMessages from './messages/de.json';
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';
import faMessages from './messages/fa.json';
import frMessages from './messages/fr.json';
import hiMessages from './messages/hi.json';
import itMessages from './messages/it.json';
import jaMessages from './messages/ja.json';
import ptMessages from './messages/pt.json';
import thMessages from './messages/th.json';
import zhMessages from './messages/zh.json';

/** Flatten a nested message tree into sorted dot-path keys. */
const flattenKeys = (tree: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(tree)
    .flatMap(([key, value]) =>
      typeof value === 'object' && value !== null
        ? flattenKeys(value as Record<string, unknown>, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    )
    .toSorted((left, right) => left.localeCompare(right));

/** ar.json carries a translators' note that has no counterpart elsewhere. */
const isTranslatorNote = (key: string): boolean => key.startsWith('_note');

const LOCALE_CATALOGS: readonly (readonly [string, Record<string, unknown>])[] = [
  ['ar', arMessages],
  ['de', deMessages],
  ['es', esMessages],
  ['fa', faMessages],
  ['fr', frMessages],
  ['hi', hiMessages],
  ['it', itMessages],
  ['ja', jaMessages],
  ['pt', ptMessages],
  ['th', thMessages],
  ['zh', zhMessages],
];

/**
 * Every locale must expose exactly the same message keys as English: a key
 * missing in one catalog would render as a raw key (or crash) for that
 * audience. This guards every namespace across all twelve locales.
 */
describe('message catalog parity', () => {
  const enKeys = flattenKeys(enMessages);

  it.each(LOCALE_CATALOGS)('has identical keys in en and %s', (_code, catalog) => {
    const keys = flattenKeys(catalog).filter((key) => !isTranslatorNote(key));

    expect(keys).toStrictEqual(enKeys);
  });

  it.each([['en', enMessages] as const, ...LOCALE_CATALOGS])(
    'has no empty message values in %s',
    (_code, catalog) => {
      const hasEmpty = (tree: Record<string, unknown>): boolean =>
        Object.values(tree).some((value) =>
          typeof value === 'object' && value !== null
            ? hasEmpty(value as Record<string, unknown>)
            : String(value).trim() === '',
        );

      expect(hasEmpty(catalog)).toBe(false);
    },
  );
});
