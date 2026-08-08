import { describe, expect, it } from 'vitest';

import { LANGUAGE_CODES } from '@/packages/i18n';
import { buildGuidePath, GUIDE_SLUGS } from '@/shared/constants/guides.constants';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';

import { buildLocalizedAlternates } from './locale-route.helper';
import { buildSitemapEntries } from './sitemap.helper';

const BASE = 'https://twinzy.example';
const LAST_MODIFIED = new Date('2026-07-18T00:00:00.000Z');

describe('buildSitemapEntries', () => {
  it('lists every first-class route and every guide in every supported language', () => {
    const urls = buildSitemapEntries(BASE, LAST_MODIFIED).map((entry) => entry.url);
    const expectedRouteUrls = LANGUAGE_CODES.flatMap((locale) =>
      Object.values(ROUTE_PATHS).map(
        (path) => `${BASE}${buildLocalizedAlternates(locale, path).canonical}`,
      ),
    );
    const expectedGuideUrls = LANGUAGE_CODES.flatMap((locale) =>
      GUIDE_SLUGS.map(
        (slug) => `${BASE}${buildLocalizedAlternates(locale, buildGuidePath(slug)).canonical}`,
      ),
    );

    expect(urls).toStrictEqual([...expectedRouteUrls, ...expectedGuideUrls]);
    expect(urls).toHaveLength(
      LANGUAGE_CODES.length * (Object.keys(ROUTE_PATHS).length + GUIDE_SLUGS.length),
    );
  });

  it('adds a complete hreflang cluster to every localized URL', () => {
    const entries = buildSitemapEntries(BASE, LAST_MODIFIED);

    for (const entry of entries) {
      expect(Object.keys(entry.alternates?.languages ?? {})).toHaveLength(
        LANGUAGE_CODES.length + 1,
      );
    }
    expect(entries[0]?.url).toBe(`${BASE}/`);
    expect(entries[0]?.alternates?.languages?.en).toBe(`${BASE}/`);
    expect(entries[0]?.alternates?.languages?.['x-default']).toBe(`${BASE}/`);
  });

  it('never lists share or payment surfaces', () => {
    const urls = buildSitemapEntries(BASE, LAST_MODIFIED).map((entry) => entry.url);

    expect(urls.some((url) => url.includes('/share'))).toBe(false);
    expect(urls.some((url) => url.includes('/paymob'))).toBe(false);
  });

  it('ranks home above the game above editorial pages', () => {
    const byUrl = new Map(
      buildSitemapEntries(BASE, LAST_MODIFIED).map((entry) => [entry.url, entry.priority]),
    );

    expect(byUrl.get(`${BASE}/`)).toBe(1);
    expect(byUrl.get(`${BASE}/en/game`)).toBeCloseTo(0.9);
    expect(byUrl.get(`${BASE}/en/about`)).toBeCloseTo(0.7);
    expect(byUrl.get(`${BASE}/en/guides/best-photo`)).toBeCloseTo(0.7);
  });

  it('stamps the provided lastModified on every entry', () => {
    const entries = buildSitemapEntries(BASE, LAST_MODIFIED);

    expect(entries.every((entry) => entry.lastModified === LAST_MODIFIED)).toBe(true);
  });

  it('normalizes a trailing slash on the base URL', () => {
    const urls = buildSitemapEntries(`${BASE}/`, LAST_MODIFIED).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/en/game`);
    expect(urls.some((url) => url.includes('//game'))).toBe(false);
  });
});
