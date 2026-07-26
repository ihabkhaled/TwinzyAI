import { NextResponse } from 'next/server';

const XML_CONTENT_TYPE = 'application/xml; charset=utf-8';
const CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

/** Escape text before interpolation into XML text or attribute nodes. */
export const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

/** Return a bounded, cacheable XML document with an explicit content type. */
export const createXmlResponse = (body: string): NextResponse =>
  new NextResponse(body, {
    headers: {
      'content-type': XML_CONTENT_TYPE,
      'cache-control': CACHE_CONTROL,
      'x-content-type-options': 'nosniff',
    },
  });
