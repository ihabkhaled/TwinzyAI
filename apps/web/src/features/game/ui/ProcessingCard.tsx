import type { ReactNode } from 'react';

import { Card, Skeleton } from '@/components/ui';
import { t } from '@/i18n';

export const ProcessingCard = (): ReactNode => (
  <Card>
    <p role="status" className="mb-1 text-base font-semibold">
      {t('game.processingText')}
    </p>
    <p className="mb-4 text-sm text-text-muted">{t('game.processingHint')}</p>
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  </Card>
);
