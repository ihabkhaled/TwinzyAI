import type { NavLinkItem, TranslateLabel } from '@/shared/components/types/shared-component.types';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';

/**
 * Builders for the two internal-navigation surfaces: the site-wide footer
 * (every first-class route) and the "keep reading" block on content pages
 * (editorial pages only, minus the page being read). Labels come from the
 * `nav` namespace, so the header, footer, and content links can never drift.
 */

/** Every first-class route, in reading order, for the site-wide footer. */
export const buildFooterNavLinks = (translate: TranslateLabel): readonly NavLinkItem[] => [
  { href: ROUTE_PATHS.home, label: translate('nav.home') },
  { href: ROUTE_PATHS.game, label: translate('nav.game') },
  { href: ROUTE_PATHS.about, label: translate('nav.about') },
  { href: ROUTE_PATHS.howItWorks, label: translate('nav.howItWorks') },
  { href: ROUTE_PATHS.aiSafety, label: translate('nav.aiSafety') },
  { href: ROUTE_PATHS.faq, label: translate('nav.faq') },
  { href: ROUTE_PATHS.help, label: translate('nav.help') },
  { href: ROUTE_PATHS.privacy, label: translate('nav.privacy') },
  { href: ROUTE_PATHS.terms, label: translate('nav.terms') },
];

/**
 * The editorial cross-links shown at the bottom of each content page. Pass the
 * page's own path as `excludePath` so a page never links to itself.
 */
export const buildContentPageLinks = (
  translate: TranslateLabel,
  excludePath?: string,
): readonly NavLinkItem[] => {
  const links: readonly NavLinkItem[] = [
    { href: ROUTE_PATHS.about, label: translate('nav.about') },
    { href: ROUTE_PATHS.howItWorks, label: translate('nav.howItWorks') },
    { href: ROUTE_PATHS.aiSafety, label: translate('nav.aiSafety') },
    { href: ROUTE_PATHS.faq, label: translate('nav.faq') },
    { href: ROUTE_PATHS.help, label: translate('nav.help') },
    { href: ROUTE_PATHS.privacy, label: translate('nav.privacy') },
    { href: ROUTE_PATHS.terms, label: translate('nav.terms') },
  ];
  return links.filter((link) => link.href !== excludePath);
};
