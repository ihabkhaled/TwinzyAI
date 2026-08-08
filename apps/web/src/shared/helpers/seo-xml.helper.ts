import { LANGUAGE_CODES } from '@/packages/i18n';
import type {
  RssDocumentOptions,
  SitemapDocumentOptions,
} from '@/shared/components/types/seo.types';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';

import { buildLocalizedAlternates, buildLocalizedPath } from './locale-route.helper';
import { escapeXml } from './xml-response.helper';

const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

const RSS_ROUTE_PATHS = [
  ROUTE_PATHS.about,
  ROUTE_PATHS.howItWorks,
  ROUTE_PATHS.aiSafety,
  ROUTE_PATHS.faq,
  ROUTE_PATHS.privacy,
] as const;

const RSS_LABEL_KEYS = ['about', 'howItWorks', 'aiSafety', 'faq', 'privacy'] as const;

/** XML sitemap index pointing at one bounded child sitemap per reviewed locale. */
export const buildSitemapIndexXml = (baseUrl: string): string => {
  const base = normalizeBaseUrl(baseUrl);
  const children = LANGUAGE_CODES.map((locale) => {
    const sitemapUrl = `${base}/sitemaps/${locale}.xml`;
    return `<sitemap><loc>${escapeXml(sitemapUrl)}</loc></sitemap>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${children}</sitemapindex>`;
};

/** Child sitemap containing canonical locale URLs and complete hreflang clusters. */
export const buildLocaleSitemapXml = ({
  baseUrl,
  locale,
  lastModified,
}: SitemapDocumentOptions): string => {
  const base = normalizeBaseUrl(baseUrl);
  const urls = Object.values(ROUTE_PATHS)
    .map((path) => {
      const localized = buildLocalizedAlternates(locale, path);
      const location = `${base}${localized.canonical}`;
      const alternates = LANGUAGE_CODES.map((language) => {
        const route = localized.languages[language] ?? localized.canonical;
        return `<xhtml:link rel="alternate" hreflang="${language}" href="${escapeXml(
          `${base}${route}`,
        )}"/>`;
      }).join('');
      return `<url><loc>${escapeXml(location)}</loc><lastmod>${lastModified.toISOString()}</lastmod>${alternates}<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(
        `${base}${localized.languages['x-default'] ?? localized.canonical}`,
      )}"/></url>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
};

/** Small editorial RSS feed; private game/share data is never a feed source. */
export const buildRssXml = ({
  baseUrl,
  locale,
  messages,
  publishedAt,
}: RssDocumentOptions): string => {
  const base = normalizeBaseUrl(baseUrl);
  const feedUrl = `${base}/${locale}/feed.xml`;
  const items = RSS_ROUTE_PATHS.map((path, index) => {
    const url = `${base}${buildLocalizedPath(locale, path)}`;
    const labelKey = RSS_LABEL_KEYS[index];
    const label =
      labelKey === undefined ? messages.app.name : (messages.nav[labelKey] ?? messages.app.name);
    return `<item><title>${escapeXml(label)}</title><link>${escapeXml(
      url,
    )}</link><guid isPermaLink="true">${escapeXml(url)}</guid><description>${escapeXml(
      messages.home.metaDescription,
    )}</description><pubDate>${publishedAt.toUTCString()}</pubDate></item>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(
    `${messages.app.name} — ${messages.app.subtitle}`,
  )}</title><link>${escapeXml(`${base}${buildLocalizedPath(locale, ROUTE_PATHS.home)}`)}</link><description>${escapeXml(
    messages.home.metaDescription,
  )}</description><language>${locale}</language><atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(
    feedUrl,
  )}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
};
