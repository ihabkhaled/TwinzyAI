import { describe, expect, it } from 'vitest';

import { buildPageTitle } from './page-title.helper';

describe('buildPageTitle', () => {
  it('composes "Section · Twinzy"', () => {
    expect(buildPageTitle('Privacy')).toBe('Privacy · Twinzy');
  });

  it('preserves the section text verbatim, including spaces', () => {
    expect(buildPageTitle('How it works')).toBe('How it works · Twinzy');
  });

  it('still returns the brand suffix for an empty section', () => {
    expect(buildPageTitle('')).toBe(' · Twinzy');
  });
});
