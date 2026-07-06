import type { ReactElement } from 'react';

import { Card } from '@/packages/ui-primitives';

import type { ResultCardProps } from '../model/game-component.types';

import {
  resultBoldClass,
  resultHeaderClass,
  resultMatchingClass,
  resultRankClass,
  resultReasonClass,
  resultScoreClass,
  resultTitleClass,
  resultVerdictClass,
  resultWeakClass,
} from './result-card.variants';

/** One ranked public style/vibe match: rank, score, verdict, reason, traits. */
export function ResultCard({ result, labels, testId }: Readonly<ResultCardProps>): ReactElement {
  return (
    <Card testId={testId}>
      <div className={resultHeaderClass}>
        <h3 className={resultTitleClass}>
          <span className={resultRankClass}>
            {labels.rankLabel} #{result.rank}
          </span>
          {result.name}
        </h3>
        <span className={resultScoreClass}>
          {labels.scoreLabel}: {result.scorePercent}%
        </span>
      </div>
      <p className={resultVerdictClass}>{result.verdictLabel}</p>
      <p className={resultReasonClass}>
        <span className={resultBoldClass}>{labels.reasonLabel}: </span>
        {result.reason}
      </p>
      {result.matchingTraits.length > 0 && (
        <p className={resultMatchingClass}>
          <span className={resultBoldClass}>{labels.matchingTraitsLabel}: </span>
          {result.matchingTraits.join(', ')}
        </p>
      )}
      {result.weakOrUncertainTraits.length > 0 && (
        <p className={resultWeakClass}>
          <span className={resultBoldClass}>{labels.weakTraitsLabel}: </span>
          {result.weakOrUncertainTraits.join(', ')}
        </p>
      )}
    </Card>
  );
}
