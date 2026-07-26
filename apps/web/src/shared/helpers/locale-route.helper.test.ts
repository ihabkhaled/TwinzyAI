import { describe, expect, it } from 'vitest';

import { ROUTE_PATHS } from '../constants/route-paths.constants';

import {
  buildLocalizedAlternates,
  buildLocalizedPath,
  isMachinePath,
  isPublicPagePath,
  parseLocalizedPath,
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

  it('parses supported prefixes and rejects unknown ones', () => {
    expect(parseLocalizedPath('/ar/privacy')).toStrictEqual({
      locale: 'ar',
      internalPath: '/privacy',
    });
    expect(parseLocalizedPath('/en/')).toStrictEqual({ locale: 'en', internalPath: '/' });
    expect(parseLocalizedPath('/xx/privacy')).toBeUndefined();
  });

  it('classifies public and machine paths', () => {
    expect(isPublicPagePath('/about')).toBe(true);
    expect(isPublicPagePath('/game')).toBe(false);
    expect(isPublicPagePath('/share/id')).toBe(false);
    expect(isMachinePath('/sitemap.xml')).toBe(true);
    expect(isMachinePath('/sitemaps/en.xml')).toBe(true);
    expect(isMachinePath('/en/feed.xml')).toBe(true);
    expect(isMachinePath('/about')).toBe(false);
  });
});
