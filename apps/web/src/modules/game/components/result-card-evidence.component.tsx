import type { ReactElement } from 'react';

import type { ResultCardEvidenceProps } from '../model/game-component.types';

import {
  resultBoldClass,
  resultMatchingClass,
  resultMismatchClass,
  resultReasonClass,
  resultWeakClass,
} from './result-card.variants';

export const ResultCardEvidence = ({
  result,
  labels,
}: Readonly<ResultCardEvidenceProps>): ReactElement => (
  <>
    <p className={resultReasonClass}>
      <span className={resultBoldClass}>{labels.reasonLabel}: </span>
      {result.reason}
    </p>
    {result.topMatchingTraits.length > 0 && (
      <p className={resultMatchingClass}>
        <span className={resultBoldClass}>{labels.matchingTraitsLabel}: </span>
        {result.topMatchingTraits.join(labels.listSeparator)}
      </p>
    )}
    {result.weakOrUncertainTraits.length > 0 && (
      <p className={resultWeakClass}>
        <span className={resultBoldClass}>{labels.weakTraitsLabel}: </span>
        {result.weakOrUncertainTraits.join(labels.listSeparator)}
      </p>
    )}
    {result.mismatchWarnings.length > 0 && (
      <p className={resultMismatchClass}>
        <span className={resultBoldClass}>{labels.mismatchLabel}: </span>
        {result.mismatchWarnings.join(labels.listSeparator)}
      </p>
    )}
  </>
);
