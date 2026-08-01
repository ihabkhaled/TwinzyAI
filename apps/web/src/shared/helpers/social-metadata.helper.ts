import type { Metadata } from 'next';

import type { SocialMetadataInput } from './social-metadata.types';

type SocialMetadata = Required<Pick<Metadata, 'openGraph' | 'twitter'>>;

/**
 * Build the Open Graph and Twitter blocks for a page. Next.js does not derive
 * `og:title`/`og:description` from the top-level metadata fields, so a page
 * that sets only `title`/`description` shares as a bare link. Composing both
 * blocks here keeps every surface consistent and testable; the image itself is
 * attached automatically from `app/opengraph-image.tsx`.
 */
export function buildSocialMetadata({
  title,
  description,
  siteName,
  ogLocale,
  path,
}: SocialMetadataInput): SocialMetadata {
  return {
    openGraph: {
      type: 'website',
      siteName,
      locale: ogLocale,
      url: path,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
