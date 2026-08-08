import type { Route } from 'next';

/** Props for one guide card on the Guides index. */
export interface GuideCardProps {
  href: Route;
  title: string;
  teaser: string;
}
