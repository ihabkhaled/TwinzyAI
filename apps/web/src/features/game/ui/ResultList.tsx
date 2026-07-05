import type { ReactNode } from 'react';

import { Alert } from '@/components/ui';
import { t } from '@/i18n';

import type { ResultView } from '../model/game.types';

import { ResultCard } from './ResultCard';

interface ResultListProps {
  results: ResultView[];
  fallbackMessage: string;
}

export const ResultList = ({ results, fallbackMessage }: ResultListProps): ReactNode => (
  <section aria-label={t('game.resultsTitle')}>
    <h2 className="mb-3 text-xl font-semibold">{t('game.resultsTitle')}</h2>
    {results.length === 0 ? (
      <Alert tone="info">
        <span className="mb-1 block font-semibold">{t('game.fallbackTitle')}</span>
        {fallbackMessage}
      </Alert>
    ) : (
      <div className="space-y-3">
        {results.map((result) => (
          <ResultCard key={result.rank} result={result} />
        ))}
      </div>
    )}
  </section>
);
