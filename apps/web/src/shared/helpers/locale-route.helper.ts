import type { Route } from 'next';

import {
  DEFAULT_LOCALE,
  isSupportedLanguageCode,
  LANGUAGE_CODES,
  type LanguageCodeValue,
} from '@/packages/i18n';

import { ROUTE_PATHS } from '../constants/route-paths.constants';

const PUBLIC_ROUTE_PATHS = new Set<string>(
  Object.values(ROUTE_PATHS).filter((path) => path !== ROUTE_PATHS.game),
);
const MACHINE_PATH_PREFIXES = ['/sitemaps/', '/_next/', '/api/'] as const;

/** Prefix a first-class route with its reviewed content locale. */
export const buildLocalizedPath = (locale: LanguageCodeValue, path: Route): Route => {
  const suffix = path === ROUTE_PATHS.home ? '' : path;
  return `/${locale}${suffix}` as Route;
};

/** Build canonical and hreflang paths for one first-class page. */
export const buildLocalizedAlternates = (
  locale: LanguageCodeValue,
  path: Route,
): {
  canonical: Route;
  languages: Record<string, Route>;
} => {
  const languages: Record<string, Route> = {};
  for (const language of LANGUAGE_CODES) {
    languages[language] = buildLocalizedPath(language, path);
  }
  languages['x-default'] = buildLocalizedPath(DEFAULT_LOCALE, path);
  return { canonical: buildLocalizedPath(locale, path), languages };
};

/** Split a public URL into a supported locale and its internal owner path. */
export const parseLocalizedPath = (
  pathname: string,
): { locale: LanguageCodeValue; internalPath: string } | undefined => {
  const [, candidate, ...segments] = pathname.split('/');
  if (!isSupportedLanguageCode(candidate)) {
    return undefined;
  }
  const internalPath = `/${segments.join('/')}`.replace(/\/$/, '') || '/';
  return { locale: candidate, internalPath };
};

/** True only for routes that receive a canonical locale prefix. */
export const isPublicPagePath = (pathname: string): pathname is Route =>
  PUBLIC_ROUTE_PATHS.has(pathname);

/** Machine endpoints keep their stable, explicitly localized route shape. */
export const isMachinePath = (pathname: string): boolean =>
  pathname === '/robots.txt' ||
  pathname === '/sitemap.xml' ||
  pathname.endsWith('/feed.xml') ||
  MACHINE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
