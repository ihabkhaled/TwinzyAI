import type { ReactElement } from 'react';

import { Alert, Button, Stack } from '@/packages/ui-primitives';

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
  testId,
}: Readonly<ErrorStateProps>): ReactElement {
  return (
    <Alert testId={testId} tone="danger">
      <Stack gap="sm">
        {message}
        <Button onClick={onRetry} variant="secondary">
          {retryLabel}
        </Button>
      </Stack>
    </Alert>
  );
}
