import { describe, expect, it } from 'vitest';

import type { RssMessages } from '@/shared/components/types/seo.types';

import { buildLocaleSitemapXml, buildRssXml, buildSitemapIndexXml } from './seo-xml.helper';

const BASE_URL = 'https://twinzy.example/';
const PUBLISHED_AT = new Date('2026-07-26T00:00:00.000Z');
const MESSAGES: RssMessages = {
  app: { name: 'Twinzy & friends', subtitle: 'Safe < fun' },
  nav: {
    about: 'About',
    howItWorks: 'How it works',
    aiSafety: 'AI safety',
    faq: 'FAQ',
    privacy: 'Privacy',
  },
  home: { metaDescription: 'Privacy & playful results' },
};

describe('SEO XML builders', () => {
  it('builds a sitemap index for every locale', () => {
    const xml = buildSitemapIndexXml(BASE_URL);
    expect(xml).toContain('<sitemapindex');
    expect(xml).toContain('https://twinzy.example/sitemaps/en.xml');
    expect(xml).toContain('https://twinzy.example/sitemaps/ja.xml');
  });

  it('builds localized sitemap URLs and hreflang clusters', () => {
    const xml = buildLocaleSitemapXml({
      baseUrl: BASE_URL,
      locale: 'fr',
      lastModified: PUBLISHED_AT,
    });
    expect(xml).toContain('<loc>https://twinzy.example/fr</loc>');
    expect(xml).toContain('hreflang="ar"');
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).not.toContain('/share/');
  });

  it('uses the unprefixed canonical root in the English homepage sitemap', () => {
    const xml = buildLocaleSitemapXml({
      baseUrl: BASE_URL,
      locale: 'en',
      lastModified: new Date('2026-08-08T00:00:00.000Z'),
    });

    expect(xml).toContain('<loc>https://twinzy.example/</loc>');
    expect(xml).toContain('hreflang="en" href="https://twinzy.example/"');
    expect(xml).toContain('hreflang="x-default" href="https://twinzy.example/"');
  });

  it('builds an escaped, editorial-only RSS feed', () => {
    const xml = buildRssXml({
      baseUrl: BASE_URL,
      locale: 'en',
      messages: MESSAGES,
      publishedAt: PUBLISHED_AT,
    });
    expect(xml).toContain('Twinzy &amp; friends');
    expect(xml).toContain('Safe &lt; fun');
    expect(xml).toContain('/en/about');
    expect(xml).not.toContain('/game');
    expect(xml).not.toContain('/share/');
  });
});
