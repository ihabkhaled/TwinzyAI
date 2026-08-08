import type { Route } from 'next';

import { DEFAULT_LOCALE, getServerLocale, isSupportedLanguageCode } from '@/packages/i18n';

import { buildLocalizedAlternates } from './locale-route.helper';

/** Resolve canonical and hreflang paths from the locale selected for this server request. */
export const buildCurrentLocaleAlternates = async (
  path: Route,
): Promise<ReturnType<typeof buildLocalizedAlternates>> => {
  const resolvedLocale = await getServerLocale();
  const locale = isSupportedLanguageCode(resolvedLocale) ? resolvedLocale : DEFAULT_LOCALE;

  return buildLocalizedAlternates(locale, path);
};
