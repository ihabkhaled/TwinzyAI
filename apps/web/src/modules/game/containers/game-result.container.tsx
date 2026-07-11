import type { ReactElement } from 'react';

import { Alert, Button, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { RetryButton } from '../components/retry-button.component';
import { ShareButton } from '../components/share-button.component';
import type { GameResultProps, TranslationStatusProps } from '../model/game-component.types';

import { DonateLink } from './donate-link.container';
import { translationBannerClass } from './game-result.variants';
import { ResultSections } from './result-sections.container';

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

/** The score/uncertainty/mismatch explanation alert shown only in-game. */
const renderExplanation = ({ labels }: GameResultProps): ReactElement => (
  <Alert tone="info" testId={TEST_IDS.resultExplanation}>
    <Stack gap="xs">
      <p>{labels.scoreExplanation}</p>
      <p>{labels.uncertaintyExplanation}</p>
      <p>{labels.mismatchExplanation}</p>
    </Stack>
  </Alert>
);

/**
 * The success-phase view: the shared {@link ResultSections} body (summary,
 * detailed traits, image quality, ranked matches, disclaimer) with the in-game
 * explanation alert slotted in, framed by the translation loading/error banner
 * during a language switch and the share/retry actions. A container so it may map.
 */
export const GameResult = (props: GameResultProps): ReactElement => (
  <Stack gap="md">
    {renderTranslationStatus({
      isTranslating: props.isTranslating,
      translatingLabel: props.translatingLabel,
      error: props.translationError,
      retryLabel: props.retryTranslationLabel,
      canRetry: props.canRetryTranslation,
      onRetry: props.onRetryTranslation,
    })}
    <ResultSections
      view={props.view}
      labels={props.labels}
      traitCountLabel={props.traitCountLabel}
      explanation={renderExplanation(props)}
    />
    <Stack direction="row" gap="sm" align="center" wrap="wrap">
      {props.view.hasResults ? (
        <ShareButton
          label={props.labels.shareButton}
          feedback={props.shareFeedback}
          onShare={props.onShare}
          testId={TEST_IDS.shareButton}
        />
      ) : null}
      <RetryButton
        label={props.labels.retryButton}
        onRetry={props.onRetry}
        testId={TEST_IDS.retryButton}
      />
      <DonateLink label={props.labels.donateLabel} />
    </Stack>
  </Stack>
);
