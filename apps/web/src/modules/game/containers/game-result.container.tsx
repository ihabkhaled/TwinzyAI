import type { ReactElement } from 'react';

import { Alert, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '@/shared/testing/test-id.helper';

import { ResultCard } from '../components/result-card.component';
import { ResultDisclaimer } from '../components/result-disclaimer.component';
import { ResultList } from '../components/result-list.component';
import { RetryButton } from '../components/retry-button.component';
import { ShareButton } from '../components/share-button.component';
import type { GameResultProps } from '../model/game-component.types';

import { translationBannerClass } from './game-result.variants';
import { ImageQuality } from './image-quality.container';
import { ResultSummary } from './result-summary.container';
import { TraitDetails } from './trait-details.container';

/** Translation loading banner + failure alert shown during a language switch. */
const renderTranslationStatus = (
  isTranslating: boolean,
  translatingLabel: string,
  translationError: string | undefined,
): ReactElement => (
  <>
    {isTranslating ? (
      <p role="status" className={translationBannerClass} data-testid={TEST_IDS.translationBanner}>
        {translatingLabel}
      </p>
    ) : null}
    {translationError === undefined ? null : <Alert tone="danger">{translationError}</Alert>}
  </>
);

/**
 * The success-phase view: compact summary + trait count first, the detailed
 * grouped accordion, image quality & uncertainty, the top style/vibe matches,
 * the safety disclaimer, and the share/retry actions — plus the translation
 * loading/error banner during a language switch. A container so it may map.
 */
export const GameResult = ({
  view,
  labels,
  traitCountLabel,
  translatingLabel,
  isTranslating,
  translationError,
  shareFeedback,
  onShare,
  onRetry,
}: GameResultProps): ReactElement => {
  const resultNodes = view.results.map((result) => (
    <ResultCard
      key={result.rank}
      result={result}
      labels={labels}
      testId={buildIndexedTestId(TEST_IDS.resultCard, result.rank)}
    />
  ));

  return (
    <Stack gap="md">
      {renderTranslationStatus(isTranslating, translatingLabel, translationError)}
      <ResultSummary
        title={labels.compactSummaryTitle}
        traitCountLabel={traitCountLabel}
        summary={view.compactTraitSummary}
      />
      <TraitDetails title={labels.detailedTraitsTitle} categories={view.categories} />
      <ImageQuality
        title={labels.imageQualityTitle}
        uncertaintyTitle={labels.uncertaintyTitle}
        fields={view.imageQuality}
        uncertainty={view.uncertainty}
      />
      <ResultList
        title={labels.title}
        fallbackTitle={labels.fallbackTitle}
        fallbackMessage={view.fallbackMessage}
        hasResults={view.hasResults}
        testId={TEST_IDS.resultList}
      >
        {resultNodes}
      </ResultList>
      <ResultDisclaimer disclaimer={view.disclaimer} testId={TEST_IDS.disclaimer} />
      <Stack direction="row" gap="sm" align="center" wrap="wrap">
        {view.hasResults ? (
          <ShareButton
            label={labels.shareButton}
            feedback={shareFeedback}
            onShare={onShare}
            testId={TEST_IDS.shareButton}
          />
        ) : null}
        <RetryButton label={labels.retryButton} onRetry={onRetry} testId={TEST_IDS.retryButton} />
      </Stack>
    </Stack>
  );
};
