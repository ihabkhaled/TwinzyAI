import type { ReactElement } from 'react';

import { AppLink } from '@/packages/link';
import { Card, CardDescription, CardTitle, Stack } from '@/packages/ui-primitives';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import type { ShareStateMessageProps } from '../model/share-component.types';

import { shareStateCtaClass } from './share-state-message.variants';

/**
 * Terminal share state (expired or not-found): a title, an explanation, and a
 * "create your own result" link back into the game. The result itself is never
 * rendered here, so an expired/unknown link never leaks any content.
 */
export function ShareStateMessage({
  title,
  description,
  createLabel,
  testId,
}: Readonly<ShareStateMessageProps>): ReactElement {
  return (
    <Card testId={testId}>
      <Stack gap="sm" align="center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <AppLink
          href={ROUTE_PATHS.game}
          className={shareStateCtaClass}
          data-testid={TEST_IDS.createOwnResult}
        >
          {createLabel}
        </AppLink>
      </Stack>
    </Card>
  );
}
