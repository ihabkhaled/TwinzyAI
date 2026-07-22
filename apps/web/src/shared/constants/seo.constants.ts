import type { LanguageCodeValue } from '@twinzy/shared';

import { ROUTE_PATHS } from './route-paths.constants';

/** Open Graph `og:locale` value for each supported UI language. */
export const OG_LOCALE_BY_LANGUAGE: Readonly<Record<LanguageCodeValue, string>> = {
  en: 'en_US',
  ar: 'ar_EG',
  it: 'it_IT',
  fa: 'fa_IR',
  fr: 'fr_FR',
  de: 'de_DE',
  es: 'es_ES',
  pt: 'pt_BR',
  hi: 'hi_IN',
  th: 'th_TH',
  zh: 'zh_CN',
  ja: 'ja_JP',
};

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
