import type { ReactNode } from 'react';

import { Card, Skeleton } from '@/components/ui';
import { t } from '@/i18n';

interface ProcessingCardProps {
  stageLabel: string;
}

export const ProcessingCard = ({ stageLabel }: ProcessingCardProps): ReactNode => (
  <Card>
    <p role="status" aria-live="polite" className="mb-1 text-base font-semibold">
      {stageLabel}
    </p>
    <p className="mb-4 text-sm text-text-muted">{t('game.processingHint')}</p>
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  </Card>
);
