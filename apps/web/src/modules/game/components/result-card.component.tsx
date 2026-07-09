import type { ReactElement } from 'react';

import { Card } from '@/packages/ui-primitives';

import type { ResultCardProps } from '../model/game-component.types';

import {
  resultBadgesClass,
  resultBoldClass,
  resultConfidenceClass,
  resultHeaderClass,
  resultMatchingClass,
  resultMetaClass,
  resultMismatchClass,
  resultRankClass,
  resultReasonClass,
  resultScoreClass,
  resultTitleClass,
  resultVerdictClass,
  resultWeakClass,
} from './result-card.variants';

/**
 * One ranked public style/vibe match: rank, score, verdict + confidence,
 * origin/category, localized reason, and the matching/weak/mismatch trait
 * references. Pure composition — everything arrives ready to render.
 */
export function ResultCard({ result, labels, testId }: Readonly<ResultCardProps>): ReactElement {
  return (
    <Card testId={testId}>
      <div className={resultHeaderClass}>
        <h3 className={resultTitleClass}>
          <span className={resultRankClass}>
            {labels.rankLabel} #{result.rank}
          </span>
          <span>{result.name}</span>
        </h3>
        <span className={resultScoreClass}>
          {labels.scoreLabel}: {result.scorePercent}%
        </span>
      </div>
      <div className={resultBadgesClass}>
        <span className={resultVerdictClass}>{result.verdictLabel}</span>
        <span className={resultConfidenceClass}>{result.confidenceLabel}</span>
      </div>
      <p className={resultMetaClass}>
        {result.countryOrRegion} · {result.categoryLabel}
      </p>
      <p className={resultReasonClass}>
        <span className={resultBoldClass}>{labels.reasonLabel}: </span>
        {result.reason}
      </p>
      {result.topMatchingTraits.length > 0 && (
        <p className={resultMatchingClass}>
          <span className={resultBoldClass}>{labels.matchingTraitsLabel}: </span>
          {result.topMatchingTraits.join(', ')}
        </p>
      )}
      {result.weakOrUncertainTraits.length > 0 && (
        <p className={resultWeakClass}>
          <span className={resultBoldClass}>{labels.weakTraitsLabel}: </span>
          {result.weakOrUncertainTraits.join(', ')}
        </p>
      )}
      {result.mismatchWarnings.length > 0 && (
        <p className={resultMismatchClass}>
          <span className={resultBoldClass}>{labels.mismatchLabel}: </span>
          {result.mismatchWarnings.join(', ')}
        </p>
      )}
    </Card>
  );
}
