import type { ReactNode } from 'react';

import { Card } from '@/components/ui';
import { t } from '@/i18n';

import type { ResultView } from '../model/game.types';

interface ResultCardProps {
  result: ResultView;
}

export const ResultCard = ({ result }: ResultCardProps): ReactNode => (
  <Card>
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-lg font-bold">
        <span className="me-2 text-sm font-semibold text-text-muted">
          {t('game.rankLabel')} #{result.rank}
        </span>
        {result.name}
      </h3>
      <span className="shrink-0 rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold">
        {t('game.resultScoreLabel')}: {result.scorePercent}%
      </span>
    </div>
    <p className="mb-2 text-sm font-medium text-accent">{result.verdictLabel}</p>
    <p className="mb-3 text-sm text-text-muted">
      <span className="font-semibold">{t('game.resultReasonLabel')}: </span>
      {result.reason}
    </p>
    {result.matchingTraits.length > 0 && (
      <p className="mb-1 text-xs text-text-muted">
        <span className="font-semibold">{t('game.resultMatchingTraitsLabel')}: </span>
        {result.matchingTraits.join(', ')}
      </p>
    )}
    {result.weakOrUncertainTraits.length > 0 && (
      <p className="text-xs text-text-muted">
        <span className="font-semibold">{t('game.resultWeakTraitsLabel')}: </span>
        {result.weakOrUncertainTraits.join(', ')}
      </p>
    )}
  </Card>
);
