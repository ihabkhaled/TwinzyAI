import type { ReactElement } from 'react';

import { Alert, Button, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import type { ErrorStateProps } from '../types/shared-component.types';

/**
 * Recoverable error state. Pure presentation: it shows the translated message
 * and a retry control wired to the handler prepared upstream — no logic, no
 * inline handlers of its own.
 */
export function ErrorState({
  message,
  retryLabel,
  onRetry,
  primaryRetryLabel,
  onPrimaryRetry,
  testId,
}: Readonly<ErrorStateProps>): ReactElement {
  return (
    <Alert testId={testId} tone="danger">
      <Stack gap="sm">
        {message}
        <Stack direction="row" gap="sm" wrap="wrap">
          {primaryRetryLabel !== undefined && onPrimaryRetry !== undefined ? (
            <Button onClick={onPrimaryRetry} variant="primary" testId={TEST_IDS.retrySamePhoto}>
              {primaryRetryLabel}
            </Button>
          ) : null}
          <Button onClick={onRetry} variant="secondary">
            {retryLabel}
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
}
