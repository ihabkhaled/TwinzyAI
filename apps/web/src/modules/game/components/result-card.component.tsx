import type { ReactElement } from 'react';

import { AppImage } from '@/packages/image';
import { Button, Card } from '@/packages/ui-primitives';

import type { ResultCardProps } from '../model/game-component.types';

import {
  resultBadgesClass,
  resultConfidenceClass,
  resultHeaderClass,
  resultMetaClass,
  resultRankClass,
  resultScoreClass,
  resultThumbnailClass,
  resultTitleClass,
  resultVerdictClass,
} from './result-card.variants';
import { ResultCardEvidence } from './result-card-evidence.component';

/**
 * One ranked public style/vibe match: rank, score, verdict + confidence,
 * origin/category, localized reason, and the matching/weak/mismatch trait
 * references. Pure composition — everything arrives ready to render.
 */
export const ResultCard = ({
  result,
  labels,
  showDetails,
  onOpenDetails,
  testId,
}: Readonly<ResultCardProps>): ReactElement => (
  <Card testId={testId}>
    {result.publicFigure?.image === undefined ? null : (
      <AppImage
        unoptimized
        src={result.publicFigure.image.thumbnailUrl}
        alt={result.publicFigure.image.alt}
        width={96}
        height={96}
        className={resultThumbnailClass}
      />
    )}
    <div className={resultHeaderClass}>
      <h3 className={resultTitleClass}>
        <span className={resultRankClass}>{labels.rankLabel}</span>
        <bdi dir="ltr">#{result.rank}</bdi>
        <bdi dir="auto">{result.name}</bdi>
      </h3>
      <span className={resultScoreClass}>
        <span>{labels.scoreLabel}: </span>
        <bdi dir="ltr">{result.scorePercent}%</bdi>
      </span>
    </div>
    <div className={resultBadgesClass}>
      <span className={resultVerdictClass}>{result.verdictLabel}</span>
      <span className={resultConfidenceClass}>{result.confidenceLabel}</span>
    </div>
    <p className={resultMetaClass}>
      <bdi dir="auto">{result.countryOrRegion}</bdi> · <bdi dir="auto">{result.categoryLabel}</bdi>
    </p>
    <ResultCardEvidence result={result} labels={labels} />
    {showDetails ? (
      <Button variant="secondary" onClick={onOpenDetails}>
        {labels.detailsButton}
      </Button>
    ) : null}
  </Card>
);
