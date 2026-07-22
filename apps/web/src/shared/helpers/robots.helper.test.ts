import { describe, expect, it } from 'vitest';

import { buildRobotsConfig } from './robots.helper';

const BASE = 'https://twinzy.example';

describe('buildRobotsConfig', () => {
  it('allows crawling everywhere except share and payment surfaces', () => {
    const config = buildRobotsConfig(BASE);
    const [rule] = Array.isArray(config.rules) ? config.rules : [config.rules];

    expect(rule.userAgent).toBe('*');
    expect(rule.allow).toBe('/');
    expect(rule.disallow).toStrictEqual(['/share/', '/paymob/']);
  });

  it('advertises the sitemap absolutely and normalizes a trailing slash', () => {
    expect(buildRobotsConfig(BASE).sitemap).toBe(`${BASE}/sitemap.xml`);
    expect(buildRobotsConfig(`${BASE}/`).sitemap).toBe(`${BASE}/sitemap.xml`);
  });
});
