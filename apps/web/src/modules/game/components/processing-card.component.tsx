import type { ReactElement } from 'react';

import { Card, Skeleton } from '@/packages/ui-primitives';

import type { ProcessingCardProps } from '../model/game-component.types';

import {
  processingHintClass,
  processingSkeletonsClass,
  processingTitleClass,
  skeletonLineMediumClass,
  skeletonLineWideClass,
  skeletonLineWiderClass,
} from './processing-card.variants';

/**
 * Polite live-region placeholder shown while the analyze pipeline runs. The
 * `role="status"` region announces each streamed stage as `stageLabel` updates.
 */
export function ProcessingCard({
  stageLabel,
  hint,
  testId,
}: Readonly<ProcessingCardProps>): ReactElement {
  return (
    <Card testId={testId}>
      <p role="status" className={processingTitleClass}>
        {stageLabel}
      </p>
      <p className={processingHintClass}>{hint}</p>
      <div className={processingSkeletonsClass}>
        <Skeleton className={skeletonLineWideClass} />
        <Skeleton className={skeletonLineMediumClass} />
        <Skeleton className={skeletonLineWiderClass} />
      </div>
    </Card>
  );
}
