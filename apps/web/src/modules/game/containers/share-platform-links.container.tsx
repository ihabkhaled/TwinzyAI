import type { ReactElement } from 'react';

import { useAppTranslation } from '@/packages/i18n';
import { ExternalLink } from '@/packages/link';
import { Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import type { SharePlatformLinksProps } from '../model/share-component.types';

import { platformLinkClass, platformTitleClass } from './share-platform-links.variants';

/**
 * Fallback platform-share buttons. Each is a plain external link to a public
 * web-intent URL (opened safely in a new tab) carrying only the temporary share
 * URL + localized text — never the photo. A container so it may map the links.
 */
export const SharePlatformLinks = ({ title, links }: SharePlatformLinksProps): ReactElement => {
  const t = useAppTranslation();

  return (
    <Stack gap="sm">
      <p className={platformTitleClass}>{title}</p>
      <Stack direction="row" gap="sm" wrap="wrap">
        {links.map((link) => (
          <ExternalLink
            key={link.platform}
            href={link.href}
            className={platformLinkClass}
            aria-label={t(link.labelKey)}
            data-testid={`${TEST_IDS.sharePlatformLink}-${link.platform}`}
          >
            {t(link.labelKey)}
          </ExternalLink>
        ))}
      </Stack>
    </Stack>
  );
};
