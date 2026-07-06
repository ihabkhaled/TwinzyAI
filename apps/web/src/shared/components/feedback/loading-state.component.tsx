import type { ReactElement } from 'react';

import { Spinner } from '@/packages/ui-primitives';

import type { LoadingStateProps } from '../types/shared-component.types';

/**
 * Busy state. Pure presentation: a Spinner labelled with the already-translated
 * text handed to it, so assistive tech announces what is loading.
 */
export function LoadingState({ label, testId }: Readonly<LoadingStateProps>): ReactElement {
  return <Spinner label={label} testId={testId} />;
}
