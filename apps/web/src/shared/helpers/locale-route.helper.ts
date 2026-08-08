import type { Route } from 'next';

import {
  DEFAULT_LOCALE,
  isSupportedLanguageCode,
  LANGUAGE_CODES,
  type LanguageCodeValue,
} from '@/packages/i18n';

import { buildGuidePath, GUIDE_SLUGS } from '../constants/guides.constants';
import { ROUTE_PATHS } from '../constants/route-paths.constants';

const PUBLIC_ROUTE_PATHS = new Set<string>(
  Object.values(ROUTE_PATHS).filter((path) => path !== ROUTE_PATHS.game),
);
/** Guide detail pages are dynamic, so they are listed separately from the static `ROUTE_PATHS`. */
const GUIDE_DETAIL_PATHS = new Set<string>(GUIDE_SLUGS.map((slug) => buildGuidePath(slug)));
const MACHINE_PATH_PREFIXES = ['/sitemaps/', '/_next/', '/api/'] as const;
const XML_FILE_SUFFIX = '.xml';

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
    languages[language] =
      language === DEFAULT_LOCALE && path === ROUTE_PATHS.home
        ? ROUTE_PATHS.home
        : buildLocalizedPath(language, path);
  }
  languages['x-default'] = languages[DEFAULT_LOCALE] ?? ROUTE_PATHS.home;
  return {
    canonical:
      locale === DEFAULT_LOCALE && path === ROUTE_PATHS.home
        ? ROUTE_PATHS.home
        : buildLocalizedPath(locale, path),
    languages,
  };
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

/** Parse a `<locale>.xml` sitemap path segment into a reviewed locale. */
export const parseLocaleSitemapSegment = (segment: string): LanguageCodeValue | undefined => {
  if (!segment.endsWith(XML_FILE_SUFFIX)) {
    return undefined;
  }
  const locale = segment.slice(0, -XML_FILE_SUFFIX.length);
  return isSupportedLanguageCode(locale) ? locale : undefined;
};

/** Replace an existing supported locale prefix while retaining the page owner path. */
export const replaceLocalizedPathLocale = (
  pathname: string,
  locale: LanguageCodeValue,
): Route | undefined => {
  const localized = parseLocalizedPath(pathname);
  if (localized === undefined || !isPublicPagePath(localized.internalPath)) {
    return undefined;
  }
  return buildLocalizedPath(locale, localized.internalPath);
};

/** True only for routes that receive a canonical locale prefix. */
export const isPublicPagePath = (pathname: string): pathname is Route =>
  PUBLIC_ROUTE_PATHS.has(pathname) || GUIDE_DETAIL_PATHS.has(pathname);

/** Machine endpoints keep their stable, explicitly localized route shape. */
export const isMachinePath = (pathname: string): boolean =>
  pathname === '/ads.txt' ||
  pathname === '/robots.txt' ||
  pathname === '/sitemap.xml' ||
  pathname.endsWith('/feed.xml') ||
  MACHINE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
