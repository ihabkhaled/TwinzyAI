import { describe, expect, it } from 'vitest';

import { ROUTE_PATHS } from '../constants/route-paths.constants';

import {
  buildLocalizedAlternates,
  buildLocalizedPath,
  isMachinePath,
  isPublicPagePath,
  parseLocaleSitemapSegment,
  parseLocalizedPath,
  replaceLocalizedPathLocale,
} from './locale-route.helper';

describe('locale route helpers', () => {
  it('builds localized routes and complete alternates', () => {
    expect(buildLocalizedPath('fr', ROUTE_PATHS.home)).toBe('/fr');
    expect(buildLocalizedPath('fr', ROUTE_PATHS.faq)).toBe('/fr/faq');
    const alternates = buildLocalizedAlternates('fr', ROUTE_PATHS.faq);
    expect(alternates.canonical).toBe('/fr/faq');
    expect(alternates.languages['en']).toBe('/en/faq');
    expect(alternates.languages['x-default']).toBe('/en/faq');
  });

  it('uses the unprefixed root as the canonical English homepage alternate', () => {
    const alternates = buildLocalizedAlternates('en', ROUTE_PATHS.home);

    expect(alternates.canonical).toBe('/');
    expect(alternates.languages['en']).toBe('/');
    expect(alternates.languages['ar']).toBe('/ar');
    expect(alternates.languages['x-default']).toBe('/');
  });

  it('parses supported prefixes and rejects unknown ones', () => {
    expect(parseLocalizedPath('/ar/privacy')).toStrictEqual({
      locale: 'ar',
      internalPath: '/privacy',
    });
    expect(parseLocalizedPath('/en/')).toStrictEqual({ locale: 'en', internalPath: '/' });
    expect(parseLocalizedPath('/xx/privacy')).toBeUndefined();
  });

  it('replaces locale prefixes only for localized editorial pages', () => {
    expect(replaceLocalizedPathLocale('/en/about', 'fr')).toBe('/fr/about');
    expect(replaceLocalizedPathLocale('/en', 'ar')).toBe('/ar');
    expect(replaceLocalizedPathLocale('/game', 'fr')).toBeUndefined();
    expect(replaceLocalizedPathLocale('/en/game', 'fr')).toBeUndefined();
  });

  it('parses only supported XML sitemap segments', () => {
    expect(parseLocaleSitemapSegment('en.xml')).toBe('en');
    expect(parseLocaleSitemapSegment('ar.xml')).toBe('ar');
    expect(parseLocaleSitemapSegment('xx.xml')).toBeUndefined();
    expect(parseLocaleSitemapSegment('en')).toBeUndefined();
  });

  it('classifies public and machine paths', () => {
    expect(isPublicPagePath('/about')).toBe(true);
    expect(isPublicPagePath('/guides')).toBe(true);
    expect(isPublicPagePath('/guides/best-photo')).toBe(true);
    expect(isPublicPagePath('/guides/not-a-real-guide')).toBe(false);
    expect(isPublicPagePath('/game')).toBe(false);
    expect(isPublicPagePath('/share/id')).toBe(false);
    expect(isMachinePath('/sitemap.xml')).toBe(true);
    expect(isMachinePath('/ads.txt')).toBe(true);
    expect(isMachinePath('/robots.txt')).toBe(true);
    expect(isMachinePath('/sitemaps/en.xml')).toBe(true);
    expect(isMachinePath('/en/feed.xml')).toBe(true);
    expect(isMachinePath('/about')).toBe(false);
  });
});
