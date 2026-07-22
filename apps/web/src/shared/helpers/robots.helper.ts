import type { MetadataRoute } from 'next';

import { ROBOTS_DISALLOWED_PATH_PREFIXES } from '@/shared/constants/seo.constants';

/** Strip one trailing slash so URL joins never produce `//`. */
const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

/**
 * Robots rules: everything is crawlable except the ephemeral share pages and
 * the payment popup return route, and the sitemap is advertised absolutely.
 */
export const buildRobotsConfig = (baseUrl: string): MetadataRoute.Robots => {
  const base = normalizeBaseUrl(baseUrl);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...ROBOTS_DISALLOWED_PATH_PREFIXES],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
};
