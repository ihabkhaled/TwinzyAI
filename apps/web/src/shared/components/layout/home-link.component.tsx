import type { ReactElement } from 'react';

import { HomeIcon } from '@/packages/icons';
import { AppLink } from '@/packages/link';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import type { HomeLinkProps } from '../types/shared-component.types';

import { headerIconLinkClass } from './app-header.variants';

/** Icon link back to the home route, shown in the app top bar. */
export function HomeLink({ label }: Readonly<HomeLinkProps>): ReactElement {
  return (
    <AppLink
      href="/"
      aria-label={label}
      className={headerIconLinkClass}
      data-testid={TEST_IDS.homeLink}
    >
      <HomeIcon aria-hidden size={18} />
    </AppLink>
  );
}
