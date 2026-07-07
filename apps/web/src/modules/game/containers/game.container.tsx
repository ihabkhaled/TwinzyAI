'use client';
// client-boundary-reason: owns the analyze mutation, file input state, and image object URL lifecycle through the game hook.

import type { ReactElement } from 'react';

import { useAppTranslation } from '@/packages/i18n';
import { Stack } from '@/packages/ui-primitives';
import { ErrorState } from '@/shared/components/feedback/error-state.component';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { buildGameScreenLabels, resolveTraitCountLabel } from '../helpers/game-display.helper';
import { useGame } from '../hooks/useGame.hook';
import { GamePhase } from '../model/game.enums';
import type { GameScreenLabels, GameViewModel, TranslateMessage } from '../model/game.types';

import { gameTitleClass } from './game.container.variants';
import { GameProcessing } from './game-processing.container';
import { GameResult } from './game-result.container';
import { GameSetup } from './game-setup.container';

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
  />
);

const renderError = (message: string, retryLabel: string, onRetry: () => void): ReactElement => (
  <ErrorState
    message={message}
    retryLabel={retryLabel}
    onRetry={onRetry}
    testId={TEST_IDS.errorState}
  />
);

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
      {vm.phase === GamePhase.Processing && renderProcessing(vm, labels, translate)}
      {vm.phase === GamePhase.Error &&
        vm.errorMessage !== undefined &&
        renderError(vm.errorMessage, labels.result.retryButton, vm.onRetry)}
      {vm.phase === GamePhase.Success && vm.resultView !== undefined && (
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
      )}
    </Stack>
  );
};
