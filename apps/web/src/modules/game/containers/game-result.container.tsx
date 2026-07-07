import type { ReactElement } from 'react';

import { Alert, Button, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '@/shared/testing/test-id.helper';

import { ResultCard } from '../components/result-card.component';
import { ResultDisclaimer } from '../components/result-disclaimer.component';
import { ResultList } from '../components/result-list.component';
import { RetryButton } from '../components/retry-button.component';
import { ShareButton } from '../components/share-button.component';
import type { GameResultView, ResultLabels } from '../model/game.types';
import type { GameResultProps, TranslationStatusProps } from '../model/game-component.types';

import { translationBannerClass } from './game-result.variants';
import { ImageQuality } from './image-quality.container';
import { ResultSummary } from './result-summary.container';
import { TraitDetails } from './trait-details.container';

/** The ranked style/vibe match cards (or the localized no-match fallback). */
const renderResultList = (view: GameResultView, labels: ResultLabels): ReactElement => (
  <ResultList
    title={labels.title}
    fallbackTitle={labels.fallbackTitle}
    fallbackMessage={view.fallbackMessage}
    hasResults={view.hasResults}
    testId={TEST_IDS.resultList}
  >
    {view.results.map((result) => (
      <ResultCard
        key={result.rank}
        result={result}
        labels={labels}
        testId={buildIndexedTestId(TEST_IDS.resultCard, result.rank)}
      />
    ))}
  </ResultList>
);

/**
 * Language-switch status: the loading banner while translating, and — on
 * failure — the localized error alongside a retry button, since a slow
 * generation or transient quota hit is recoverable by simply asking again.
 */
const renderTranslationStatus = ({
  isTranslating,
  translatingLabel,
  error,
  retryLabel,
  canRetry,
  onRetry,
}: TranslationStatusProps): ReactElement => (
  <>
    {isTranslating ? (
      <p role="status" className={translationBannerClass} data-testid={TEST_IDS.translationBanner}>
        {translatingLabel}
      </p>
    ) : null}
    {error === undefined ? null : (
      <Alert tone="danger">
        <Stack direction="row" gap="sm" align="center" wrap="wrap">
          <span>{error}</span>
          {canRetry ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              testId={TEST_IDS.translationRetry}
            >
              {retryLabel}
            </Button>
          ) : null}
        </Stack>
      </Alert>
    )}
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
  retryTranslationLabel,
  isTranslating,
  translationError,
  canRetryTranslation,
  onRetryTranslation,
  shareFeedback,
  onShare,
  onRetry,
}: GameResultProps): ReactElement => (
  <Stack gap="md">
    {renderTranslationStatus({
      isTranslating,
      translatingLabel,
      error: translationError,
      retryLabel: retryTranslationLabel,
      canRetry: canRetryTranslation,
      onRetry: onRetryTranslation,
    })}
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
    {renderResultList(view, labels)}
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
