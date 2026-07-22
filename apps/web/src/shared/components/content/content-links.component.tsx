import type { ReactElement } from 'react';

import type { ContentLinksProps } from '../types/shared-component.types';

import {
  contentLinksListClass,
  contentLinksSectionClass,
  contentLinksTitleClass,
} from './content-links.variants';

/**
 * The "keep reading" block at the bottom of each editorial page: internal
 * links between the content pages so readers (and crawlers) can reach every
 * page from every other page. The page maps its links to
 * {@link ContentLinkItem} children.
 */
export function ContentLinks({ title, children }: Readonly<ContentLinksProps>): ReactElement {
  return (
    <nav aria-label={title} className={contentLinksSectionClass}>
      <h2 className={contentLinksTitleClass}>{title}</h2>
      <ul className={contentLinksListClass}>{children}</ul>
    </nav>
  );
}
