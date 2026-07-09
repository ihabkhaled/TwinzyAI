import { describe, expect, it } from 'vitest';

import { DEFAULT_LANGUAGE_CODE, isSupportedLanguageCode, LANGUAGE_CODES } from '@twinzy/shared';

import { DEFAULT_LOCALE, getLocaleDirection, LOCALE_COOKIE_NAME } from './locale.constants';

describe('isSupportedLanguageCode', () => {
  it('accepts every shipped locale', () => {
    for (const locale of LANGUAGE_CODES) {
      expect(isSupportedLanguageCode(locale)).toBe(true);
    }
  });

  it('rejects an unknown locale string', () => {
    expect(isSupportedLanguageCode('fr')).toBe(false);
    expect(isSupportedLanguageCode('')).toBe(false);
  });

  it('rejects non-string values', () => {
    const missing: unknown = undefined;

    expect(isSupportedLanguageCode(missing)).toBe(false);
    expect(isSupportedLanguageCode(null)).toBe(false);
    expect(isSupportedLanguageCode(42)).toBe(false);
    expect(isSupportedLanguageCode({ locale: 'en' })).toBe(false);
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
  it('defaults to the shared default language code', () => {
    expect(DEFAULT_LOCALE).toBe(DEFAULT_LANGUAGE_CODE);
  });

  it('exposes the shared locale cookie name', () => {
    expect(LOCALE_COOKIE_NAME).toBe('NEXT_LOCALE');
  });

  it('ships English and Arabic via the shared language codes', () => {
    expect(LANGUAGE_CODES).toStrictEqual(['en', 'ar']);
  });
});
