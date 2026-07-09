import { describe, expect, it } from 'vitest';

import { isConsentGiven } from '../lib/consent';

describe('isConsentGiven', () => {
  it('returns true for the literal string "true"', () => {
    expect(isConsentGiven({ consent: 'true' })).toBe(true);
  });

  it('returns true for boolean true', () => {
    expect(isConsentGiven({ consent: true })).toBe(true);
  });

  it('returns false when consent is absent', () => {
    expect(isConsentGiven({})).toBe(false);
  });

  it('returns false for any other value', () => {
    expect(isConsentGiven({ consent: 'yes' })).toBe(false);
    expect(isConsentGiven({ consent: false })).toBe(false);
  });
});
