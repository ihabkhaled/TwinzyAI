import type { ReactElement } from 'react';

import { AppLink } from '@/packages/link';
import { Card, CardDescription, CardTitle } from '@/packages/ui-primitives';

import type { GuideCardProps } from './guide-card.types';
import { guideCardLinkClass } from './guides.variants';

/** One guide teaser card on the Guides index, linking to its detail page. */
export function GuideCard({ href, title, teaser }: Readonly<GuideCardProps>): ReactElement {
  return (
    <AppLink href={href} className={guideCardLinkClass}>
      <Card>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{teaser}</CardDescription>
      </Card>
    </AppLink>
  );
}
