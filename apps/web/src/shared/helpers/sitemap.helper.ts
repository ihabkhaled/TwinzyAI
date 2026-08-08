import type { MetadataRoute, Route } from 'next';

import { LANGUAGE_CODES, type LanguageCodeValue } from '@/packages/i18n';
import { buildGuidePath, GUIDE_SLUGS } from '@/shared/constants/guides.constants';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import {
  DEFAULT_SITEMAP_PRIORITY,
  SITEMAP_PRIORITY_BY_PATH,
} from '@/shared/constants/seo.constants';

import { buildLocalizedAlternates } from './locale-route.helper';

/** Strip one trailing slash so URL joins never produce `//`. */
const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

/** One sitemap row: a page's canonical URL plus its complete hreflang cluster. */
const buildSitemapEntry = (
  base: string,
  locale: LanguageCodeValue,
  path: Route,
  lastModified: Date,
  priority: number,
): MetadataRoute.Sitemap[number] => {
  const localized = buildLocalizedAlternates(locale, path);
  return {
    url: `${base}${localized.canonical}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority,
    alternates: {
      languages: Object.fromEntries(
        Object.entries(localized.languages).map(([language, route]) => [
          language,
          `${base}${route}`,
        ]),
      ),
    },
  };
};

/**
 * Sitemap entries for every first-class route and every guide. Ephemeral share
 * pages and the payment return route are deliberately absent — they are
 * noindex, transient surfaces that must never be crawled.
 */
export const buildSitemapEntries = (baseUrl: string, lastModified: Date): MetadataRoute.Sitemap => {
  const base = normalizeBaseUrl(baseUrl);

  const routeEntries = LANGUAGE_CODES.flatMap((locale) =>
    Object.values(ROUTE_PATHS).map((path) =>
      buildSitemapEntry(
        base,
        locale,
        path,
        lastModified,
        SITEMAP_PRIORITY_BY_PATH[path] ?? DEFAULT_SITEMAP_PRIORITY,
      ),
    ),
  );
  const guideEntries = LANGUAGE_CODES.flatMap((locale) =>
    GUIDE_SLUGS.map((slug) =>
      buildSitemapEntry(base, locale, buildGuidePath(slug), lastModified, DEFAULT_SITEMAP_PRIORITY),
    ),
  );

  return [...routeEntries, ...guideEntries];
};
