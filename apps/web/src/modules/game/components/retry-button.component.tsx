import type { ReactElement } from 'react';

import { Button } from '@/packages/ui-primitives';

import type { RetryButtonProps } from '../model/game-component.types';

/** Secondary "try another photo" control that resets the flow to setup. */
export function RetryButton({ label, onRetry, testId }: Readonly<RetryButtonProps>): ReactElement {
  return (
    <Button variant="secondary" onClick={onRetry} testId={testId}>
      {label}
    </Button>
  );
}
