import type { ReactElement } from 'react';

import { Alert } from '@/packages/ui-primitives';

import type { EmptyStateProps } from '../types/shared-component.types';

/**
 * Neutral "nothing here" state. Pure presentation: it renders the already
 * translated message it is handed inside an informational Alert.
 */
export function EmptyState({ message, testId }: Readonly<EmptyStateProps>): ReactElement {
  return (
    <Alert testId={testId} tone="info">
      {message}
    </Alert>
  );
}
