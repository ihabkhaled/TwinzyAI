import { describe, expect, it } from 'vitest';

import { buildSocialMetadata } from './social-metadata.helper';
import type { SocialMetadataInput } from './social-metadata.types';

const INPUT: SocialMetadataInput = {
  title: 'Find your public vibe match · Twinzy',
  description: 'Upload a photo and get a fun style/vibe result.',
  siteName: 'Twinzy',
  ogLocale: 'en_US',
  path: '/',
};

describe('buildSocialMetadata', () => {
  it('mirrors the page title and description into Open Graph', () => {
    const { openGraph } = buildSocialMetadata(INPUT);

    expect(openGraph).toMatchObject({
      type: 'website',
      title: INPUT.title,
      description: INPUT.description,
      siteName: INPUT.siteName,
      locale: INPUT.ogLocale,
      url: INPUT.path,
    });
  });

  it('mirrors the same copy into the Twitter card', () => {
    const { twitter } = buildSocialMetadata(INPUT);

    expect(twitter).toStrictEqual({
      card: 'summary_large_image',
      title: INPUT.title,
      description: INPUT.description,
    });
  });

  it('carries the resolved locale through for non-English pages', () => {
    const { openGraph } = buildSocialMetadata({ ...INPUT, ogLocale: 'ar_EG' });

    expect(openGraph).toMatchObject({ locale: 'ar_EG' });
  });
});
