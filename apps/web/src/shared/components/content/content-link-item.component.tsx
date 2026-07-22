import type { ReactElement } from 'react';

import { AppLink } from '@/packages/link';

import type { ContentLinkItemProps } from '../types/shared-component.types';

import { contentLinksItemClass } from './content-links.variants';

/** One editorial cross-link: a typed internal route with its translated label. */
export function ContentLinkItem({ href, label }: Readonly<ContentLinkItemProps>): ReactElement {
  return (
    <li>
      <AppLink href={href} className={contentLinksItemClass}>
        {label}
      </AppLink>
    </li>
  );
}
