import type { MetadataRoute } from 'next';

import { LANGUAGE_CODES } from '@/packages/i18n';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import {
  DEFAULT_SITEMAP_PRIORITY,
  SITEMAP_PRIORITY_BY_PATH,
} from '@/shared/constants/seo.constants';

import { buildLocalizedAlternates } from './locale-route.helper';

/** Strip one trailing slash so URL joins never produce `//`. */
const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

/**
 * Sitemap entries for every first-class route. Ephemeral share pages and the
 * payment return route are deliberately absent — they are noindex, transient
 * surfaces that must never be crawled.
 */
export const buildSitemapEntries = (baseUrl: string, lastModified: Date): MetadataRoute.Sitemap => {
  const base = normalizeBaseUrl(baseUrl);

  return LANGUAGE_CODES.flatMap((locale) =>
    Object.values(ROUTE_PATHS).map((path) => {
      const localized = buildLocalizedAlternates(locale, path);
      return {
        url: `${base}${localized.canonical}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: SITEMAP_PRIORITY_BY_PATH[path] ?? DEFAULT_SITEMAP_PRIORITY,
        alternates: {
          languages: Object.fromEntries(
            Object.entries(localized.languages).map(([language, route]) => [
              language,
              `${base}${route}`,
            ]),
          ),
        },
      };
    }),
  );
};
