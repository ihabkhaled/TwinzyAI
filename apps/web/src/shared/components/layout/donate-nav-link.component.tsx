import type { ReactElement } from 'react';

import { HeartIcon } from '@/packages/icons';
import { ExternalLink } from '@/packages/link';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import type { DonateNavLinkProps } from '../types/shared-component.types';

import { headerDonateLabelClass, headerDonateLinkClass } from './app-header.variants';

/**
 * Compact voluntary PayPal donate link for the app top bar. Pure composition:
 * the layout resolves the env-driven URL (and hides the link by not rendering
 * this component when no handle is configured). Outbound-safe via ExternalLink.
 */
export function DonateNavLink({ href, label }: Readonly<DonateNavLinkProps>): ReactElement {
  return (
    <ExternalLink
      href={href}
      aria-label={label}
      className={headerDonateLinkClass}
      data-testid={TEST_IDS.navDonateLink}
    >
      <HeartIcon aria-hidden size={18} />
      <span className={headerDonateLabelClass}>{label}</span>
    </ExternalLink>
  );
}
