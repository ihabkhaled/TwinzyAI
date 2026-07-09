import { describe, expect, it } from 'vitest';

import { buildPlatformLinks } from '../helpers/share-platform.helper';
import { SHARE_PLATFORM_ORDER } from '../model/share.constants';
import { SharePlatform } from '../model/share.enums';

const CONTENT = {
  url: 'https://twinzy.app/share/3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b',
  text: 'I tried Twinzy & got matches!',
};

describe('buildPlatformLinks', () => {
  const links = buildPlatformLinks(CONTENT);

  it('builds one link per configured platform, in order', () => {
    expect(links.map((link) => link.platform)).toEqual([...SHARE_PLATFORM_ORDER]);
  });

  it('URL-encodes the share URL into every href (no raw injection)', () => {
    const encodedUrl = encodeURIComponent(CONTENT.url);
    for (const link of links) {
      expect(link.href).toContain(encodedUrl);
      // The raw ampersand from the text must be percent-encoded, never literal.
      expect(link.href).not.toContain('got matches!');
    }
  });

  it('routes each platform to its correct public web-intent host', () => {
    const byPlatform = new Map(links.map((link) => [link.platform, link.href]));
    expect(byPlatform.get(SharePlatform.WhatsApp)).toContain('https://wa.me/');
    expect(byPlatform.get(SharePlatform.Telegram)).toContain('https://t.me/share/url');
    expect(byPlatform.get(SharePlatform.Facebook)).toContain('facebook.com/sharer');
    expect(byPlatform.get(SharePlatform.X)).toContain('twitter.com/intent/tweet');
    expect(byPlatform.get(SharePlatform.LinkedIn)).toContain('linkedin.com/sharing');
    expect(byPlatform.get(SharePlatform.Reddit)).toContain('reddit.com/submit');
    expect(byPlatform.get(SharePlatform.Email)).toContain('mailto:');
  });

  it('carries a translatable accessible label key per platform', () => {
    for (const link of links) {
      expect(link.labelKey).toMatch(/^share\.platform\./u);
    }
  });
});
