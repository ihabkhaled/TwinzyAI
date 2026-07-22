import { describe, expect, it } from 'vitest';

import { resolveRequestLanguage } from '../lib/request-language';

describe('resolveRequestLanguage', () => {
  it('returns the provided supported language code', () => {
    expect(resolveRequestLanguage({ languageCode: 'ar' })).toBe('ar');
    expect(resolveRequestLanguage({ languageCode: 'fr' })).toBe('fr');
    expect(resolveRequestLanguage({ languageCode: 'ja' })).toBe('ja');
  });

  it('normalizes an unsupported code to the default', () => {
    expect(resolveRequestLanguage({ languageCode: 'xx' })).toBe('en');
  });

  it('falls back to the default when languageCode is missing', () => {
    expect(resolveRequestLanguage({})).toBe('en');
  });

  it('falls back to the default for malformed input', () => {
    expect(resolveRequestLanguage({ languageCode: 123 })).toBe('en');
  });
});
