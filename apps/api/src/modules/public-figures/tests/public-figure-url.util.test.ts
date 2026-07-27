import { describe, expect, it } from 'vitest';

import { assertAllowedPublicFigureUrl, buildGoogleSearchUrl } from '../lib/public-figure-url.util';

describe('public-figure URL safety', () => {
  it('accepts only HTTPS URLs on the source allowlist', () => {
    expect(assertAllowedPublicFigureUrl('https://en.wikipedia.org/wiki/Example')).toBe(
      'https://en.wikipedia.org/wiki/Example',
    );
    const insecureUrl = `http://en.wikipedia.org/wiki/Example`;
    expect(() => assertAllowedPublicFigureUrl(insecureUrl)).toThrow('HTTPS');
    expect(() => assertAllowedPublicFigureUrl('https://attacker.example/wiki/Example')).toThrow(
      'allowlisted',
    );
    expect(() =>
      assertAllowedPublicFigureUrl('https://wikipedia.org.attacker.example/wiki/Example'),
    ).toThrow('allowlisted');
  });

  it('constructs a Google link from a verified canonical name instead of trusting a URL', () => {
    expect(buildGoogleSearchUrl('Omar Sharif')).toBe('https://www.google.com/search?q=Omar+Sharif');
  });
});
