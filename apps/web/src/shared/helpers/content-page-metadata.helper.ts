import type { Metadata, Route } from 'next';

import {
  DEFAULT_LOCALE,
  getServerLocale,
  getServerTranslations,
  isSupportedLanguageCode,
} from '@/packages/i18n';
import { OG_LOCALE_BY_LANGUAGE } from '@/shared/constants/seo.constants';

import { buildPageTitle } from './page-title.helper';
import { buildCurrentLocaleAlternates } from './server-locale-route.helper';
import { buildSocialMetadata } from './social-metadata.helper';

interface ContentPageMetadataInput {
  path: Route;
  title: string;
  description: string;
}

/**
 * Compose `generateMetadata()` for a static content page: the page title
 * (brand-suffixed), description, canonical/hreflang alternates, and matching
 * Open Graph + Twitter blocks. Every content page called this instead of
 * hand-rolling the same five fields, so a page can no longer forget to mirror
 * its own title/description into the social preview (they used to silently
 * inherit the homepage's).
 */
export async function buildContentPageMetadata({
  path,
  title,
  description,
}: ContentPageMetadataInput): Promise<Metadata> {
  const [appT, alternates, resolvedLocale] = await Promise.all([
    getServerTranslations('app'),
    buildCurrentLocaleAlternates(path),
    getServerLocale(),
  ]);
  const locale = isSupportedLanguageCode(resolvedLocale) ? resolvedLocale : DEFAULT_LOCALE;
  const pageTitle = buildPageTitle(title);

  return {
    title: pageTitle,
    description,
    alternates,
    ...buildSocialMetadata({
      title: pageTitle,
      description,
      siteName: appT('name'),
      ogLocale: OG_LOCALE_BY_LANGUAGE[locale],
      path: alternates.canonical,
    }),
  };
}
