'use client';
// client-boundary-reason: owns the analyze mutation, file input state, and image object URL lifecycle through the game hook.

import type { ReactElement } from 'react';

import { useAppTranslation } from '@/packages/i18n';
import { Stack } from '@/packages/ui-primitives';
import { ErrorState } from '@/shared/components/feedback/error-state.component';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { ProcessingCard } from '../components/processing-card.component';
import { buildGameScreenLabels, resolveTraitCountLabel } from '../helpers/game-display.helper';
import { useGame } from '../hooks/useGame.hook';
import { GamePhase } from '../model/game.enums';
import type { GameScreenLabels, GameViewModel, TranslateMessage } from '../model/game.types';

import { gameTitleClass } from './game.container.variants';
import { GameProcessing } from './game-processing.container';
import { GameResult } from './game-result.container';
import { GameSetup } from './game-setup.container';
import { PaymentStep } from './payment-step.container';
import { ShareModal } from './share-modal.container';

const renderProcessing = (
  vm: GameViewModel,
  labels: GameScreenLabels,
  translate: TranslateMessage,
): ReactElement => (
  <GameProcessing
    stageLabel={vm.stageLabel}
    hint={labels.processingHint}
    traitsTitle={labels.liveTraitsTitle}
    candidatesTitle={labels.liveCandidatesTitle}
    traitCountLabel={
      vm.liveTraitCount === undefined
        ? undefined
        : resolveTraitCountLabel(translate, vm.liveTraitCount)
    }
    summary={vm.liveSummary}
    candidateNames={vm.liveCandidates}
    cancelLabel={labels.cancelProcessing}
    onCancel={vm.onCancelProcessing}
  />
);

const renderError = (vm: GameViewModel, labels: GameScreenLabels): ReactElement => (
  <ErrorState
    message={vm.errorMessage ?? ''}
    retryLabel={labels.result.retryButton}
    onRetry={vm.onRetry}
    primaryRetryLabel={vm.canRetrySamePhoto ? labels.retrySamePhoto : undefined}
    onPrimaryRetry={vm.canRetrySamePhoto ? vm.onRetrySamePhoto : undefined}
    testId={TEST_IDS.errorState}
  />
);

/**
 * While a language switch is translating, the whole result is hidden behind this
 * loader so the user never sees the old-language result under new-language
 * labels — the full result reveals at once, in the new language, when done.
 */
const renderTranslating = (labels: GameScreenLabels): ReactElement => (
  <ProcessingCard
    stageLabel={labels.translating}
    hint={labels.translatingHint}
    testId={TEST_IDS.translationLoader}
  />
);

/**
 * Success phase: the translating loader while a language switch is in flight,
 * otherwise the full (new-language) result once it is ready.
 */
const renderSuccess = (
  vm: GameViewModel,
  labels: GameScreenLabels,
  translate: TranslateMessage,
): ReactElement | null => {
  if (vm.translation.isTranslating) {
    return renderTranslating(labels);
  }
  if (vm.resultView === undefined) {
    return null;
  }
  return (
    <GameResult
      view={vm.resultView}
      labels={labels.result}
      traitCountLabel={resolveTraitCountLabel(translate, vm.resultView.traitCount)}
      translatingLabel={labels.translating}
      retryTranslationLabel={labels.retryTranslation}
      isTranslating={vm.translation.isTranslating}
      translationError={vm.translation.errorMessage}
      canRetryTranslation={vm.translation.canRetry}
      onRetryTranslation={vm.translation.onRetry}
      shareFeedback={vm.share.feedback}
      onShare={vm.onShareResult}
      onRetry={vm.onRetry}
    />
  );
};

/**
 * The documented wiring point for the game flow. Calls the orchestrator hook,
 * resolves static copy once, switches on the phase, and maps the view-model
 * lists into pure JSX-only components.
 */
export const GameContainer = (): ReactElement => {
  const t = useAppTranslation();
  const translate = (key: string, values?: Record<string, string | number>): string =>
    t(key, values);
  const labels = buildGameScreenLabels(translate);
  const vm = useGame();

  return (
    <Stack gap="lg">
      <h1 className={gameTitleClass}>{labels.title}</h1>
      {vm.phase === GamePhase.Setup && <GameSetup vm={vm} labels={labels} />}
      {vm.phase === GamePhase.Payment && (
        <PaymentStep
          title={labels.paymentTitle}
          description={labels.paymentDescription}
          loadingLabel={labels.paymentLoading}
          cancelLabel={labels.paymentCancel}
          errorMessage={vm.paymentErrorMessage}
          payment={vm.payment}
        />
      )}
      {vm.phase === GamePhase.Processing && renderProcessing(vm, labels, translate)}
      {vm.phase === GamePhase.Error && vm.errorMessage !== undefined && renderError(vm, labels)}
      {vm.phase === GamePhase.Success && renderSuccess(vm, labels, translate)}
      {vm.shareModal.isOpen ? <ShareModal {...vm.shareModal} /> : null}
    </Stack>
  );
};
