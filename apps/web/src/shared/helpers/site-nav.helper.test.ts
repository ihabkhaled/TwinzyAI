import { describe, expect, it } from 'vitest';

import { buildContentPageLinks, buildFooterNavLinks } from './site-nav.helper';

const echoTranslate = (key: string): string => key;

describe('buildFooterNavLinks', () => {
  it('lists every first-class route with its nav label', () => {
    const links = buildFooterNavLinks(echoTranslate);

    expect(links.map((link) => link.href)).toStrictEqual([
      '/',
      '/game',
      '/about',
      '/how-it-works',
      '/ai-safety',
      '/faq',
      '/help',
      '/privacy',
      '/terms',
    ]);
    expect(links.map((link) => link.label)).toStrictEqual([
      'nav.home',
      'nav.game',
      'nav.about',
      'nav.howItWorks',
      'nav.aiSafety',
      'nav.faq',
      'nav.help',
      'nav.privacy',
      'nav.terms',
    ]);
  });

  it('never links to transient surfaces (share, paymob)', () => {
    const hrefs = buildFooterNavLinks(echoTranslate).map((link) => link.href);

    expect(hrefs.some((href) => href.startsWith('/share'))).toBe(false);
    expect(hrefs.some((href) => href.startsWith('/paymob'))).toBe(false);
  });
});

describe('buildContentPageLinks', () => {
  it('links the editorial pages without home or the game', () => {
    const hrefs = buildContentPageLinks(echoTranslate).map((link) => link.href);

    expect(hrefs).toStrictEqual([
      '/about',
      '/how-it-works',
      '/ai-safety',
      '/faq',
      '/help',
      '/privacy',
      '/terms',
    ]);
  });

  it('excludes the page being read so a page never links to itself', () => {
    const hrefs = buildContentPageLinks(echoTranslate, '/faq').map((link) => link.href);

    expect(hrefs).not.toContain('/faq');
    expect(hrefs).toHaveLength(6);
  });
});
