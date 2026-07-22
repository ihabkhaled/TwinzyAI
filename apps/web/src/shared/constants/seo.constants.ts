import { ROUTE_PATHS } from './route-paths.constants';

/**
 * Sitemap priorities per route. The homepage and the game are the primary
 * destinations; editorial pages share a default. Paths not listed here fall
 * back to {@link DEFAULT_SITEMAP_PRIORITY}.
 */
export const SITEMAP_PRIORITY_BY_PATH: Readonly<Record<string, number>> = {
  [ROUTE_PATHS.home]: 1,
  [ROUTE_PATHS.game]: 0.9,
};

export const DEFAULT_SITEMAP_PRIORITY = 0.7;

/**
 * Crawler-excluded prefixes: ephemeral share pages (temporary AI results,
 * already noindex) and the payment popup return route. Kept in one place so
 * robots rules and any future sitemap filtering can never disagree.
 */
export const ROBOTS_DISALLOWED_PATH_PREFIXES = ['/share/', '/paymob/'] as const;
