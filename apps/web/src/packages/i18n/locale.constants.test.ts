import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOCALE,
  getLocaleDirection,
  isSupportedLocale,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
} from './locale.constants';

describe('isSupportedLocale', () => {
  it('accepts every shipped locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(isSupportedLocale(locale)).toBe(true);
    }
  });

  it('rejects an unknown locale string', () => {
    expect(isSupportedLocale('fr')).toBe(false);
    expect(isSupportedLocale('')).toBe(false);
  });

  it('rejects non-string values', () => {
    const missing: unknown = undefined;

    expect(isSupportedLocale(missing)).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
    expect(isSupportedLocale(42)).toBe(false);
    expect(isSupportedLocale({ locale: 'en' })).toBe(false);
  });
});

describe('getLocaleDirection', () => {
  it('returns rtl for Arabic', () => {
    expect(getLocaleDirection('ar')).toBe('rtl');
  });

  it('returns ltr for English', () => {
    expect(getLocaleDirection('en')).toBe('ltr');
  });
});

describe('locale constants', () => {
  it('defaults to English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('exposes the shared locale cookie name', () => {
    expect(LOCALE_COOKIE_NAME).toBe('NEXT_LOCALE');
  });

  it('ships English and Arabic', () => {
    expect(SUPPORTED_LOCALES).toStrictEqual(['en', 'ar']);
  });
});
