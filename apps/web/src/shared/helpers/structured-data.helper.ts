/**
 * Builders for the JSON-LD structured data embedded on editorial pages so
 * search engines get machine-readable page semantics (rich-result eligible).
 * Pure and fully parameterized — pages resolve the translated strings.
 */

/** Strip one trailing slash so URL joins never produce `//`. */
const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

/**
 * Serialize JSON-LD for embedding in a `<script type="application/ld+json">`
 * data block. `<` is escaped so the payload can never terminate the script
 * element early (the standard XSS-hardening for embedded JSON).
 */
export const serializeJsonLd = (data: Record<string, unknown>): string =>
  JSON.stringify(data).replaceAll('<', '\\u003C');

/** The WebApplication descriptor for the homepage. */
export const buildWebApplicationJsonLd = (
  siteBaseUrl: string,
  name: string,
  description: string,
  offerPrice: string,
  offerCurrency: string,
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name,
  description,
  url: `${normalizeBaseUrl(siteBaseUrl)}/`,
  applicationCategory: 'EntertainmentApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: offerPrice,
    priceCurrency: offerCurrency,
  },
});

/** The FAQPage descriptor: `[question, answer]` pairs in display order. */
export const buildFaqPageJsonLd = (
  items: ReadonlyArray<readonly [string, string]>,
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(([question, answer]) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
});
