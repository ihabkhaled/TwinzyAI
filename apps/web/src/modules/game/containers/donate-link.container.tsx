import type { ReactElement } from 'react';

import { ExternalLink } from '@/packages/link';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { resolveDonateUrl } from '@/shared/helpers/donate-link.helper';

import type { DonateLinkProps } from '../model/game-component.types';

import { donateLinkClass } from './donate-link.variants';

/**
 * Voluntary "support the project" PayPal link. Renders nothing when no
 * PayPal.me handle is configured. Strictly a plain outbound link — the app
 * never processes money, never gates anything on payment, and the URL's only
 * variable part is the env-validated alphanumeric handle. A container so it
 * may resolve the env-driven URL.
 */
export const DonateLink = ({ label }: DonateLinkProps): ReactElement | null => {
  const donateUrl = resolveDonateUrl();

  if (donateUrl === undefined) {
    return null;
  }

  return (
    <ExternalLink
      href={donateUrl}
      className={donateLinkClass}
      aria-label={label}
      data-testid={TEST_IDS.donateLink}
    >
      {label}
    </ExternalLink>
  );
};
