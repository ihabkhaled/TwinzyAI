import { describe, expect, it } from 'vitest';

import { buildSitemapEntries } from './sitemap.helper';

const BASE = 'https://twinzy.example';

describe('buildSitemapEntries', () => {
  it('lists every first-class route as an absolute URL', () => {
    const urls = buildSitemapEntries(BASE).map((entry) => entry.url);

    expect(urls).toStrictEqual([
      `${BASE}/`,
      `${BASE}/game`,
      `${BASE}/help`,
      `${BASE}/privacy`,
      `${BASE}/terms`,
      `${BASE}/about`,
      `${BASE}/how-it-works`,
      `${BASE}/ai-safety`,
      `${BASE}/faq`,
    ]);
  });

  it('never lists share or payment surfaces', () => {
    const urls = buildSitemapEntries(BASE).map((entry) => entry.url);

    expect(urls.some((url) => url.includes('/share'))).toBe(false);
    expect(urls.some((url) => url.includes('/paymob'))).toBe(false);
  });

  it('ranks home above the game above editorial pages', () => {
    const byUrl = new Map(buildSitemapEntries(BASE).map((entry) => [entry.url, entry.priority]));

    expect(byUrl.get(`${BASE}/`)).toBe(1);
    expect(byUrl.get(`${BASE}/game`)).toBeCloseTo(0.9);
    expect(byUrl.get(`${BASE}/about`)).toBeCloseTo(0.7);
  });

  it('normalizes a trailing slash on the base URL', () => {
    const urls = buildSitemapEntries(`${BASE}/`).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/game`);
    expect(urls.some((url) => url.includes('//game'))).toBe(false);
  });
});
