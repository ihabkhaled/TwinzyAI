'use client';
// client-boundary-reason: owns the analyze mutation, file input state, and image object URL lifecycle through the game hook.

import type { ChangeEventHandler, ReactElement } from 'react';

import { useAppTranslation } from '@/packages/i18n';
import { Button, Stack } from '@/packages/ui-primitives';
import { ErrorState } from '@/shared/components/feedback/error-state.component';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '@/shared/testing/test-id.helper';

import { PrivacyNotice } from '../components/privacy-notice.component';
import { ProcessingCard } from '../components/processing-card.component';
import { ResultCard } from '../components/result-card.component';
import { ResultDisclaimer } from '../components/result-disclaimer.component';
import { ResultList } from '../components/result-list.component';
import { RetryButton } from '../components/retry-button.component';
import { ShareButton } from '../components/share-button.component';
import { TraitItem } from '../components/trait-item.component';
import { TraitList } from '../components/trait-list.component';
import { UploadCard } from '../components/upload-card.component';
import { UploadConsent } from '../components/upload-consent.component';
import { buildGameScreenLabels } from '../helpers/game-display.helper';
import { useGame } from '../hooks/useGame.hook';
import {
  CAMERA_CAPTURE_MODE,
  CAMERA_INPUT_ACCEPT,
  UPLOAD_INPUT_ACCEPT,
} from '../model/game.constants';
import { GamePhase } from '../model/game.enums';
import type { GameResultView, GameScreenLabels, GameViewModel } from '../model/game.types';

import { gameTitleClass } from './game.container.variants';

const renderSetup = (vm: GameViewModel, labels: GameScreenLabels): ReactElement => {
  const onFileInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    vm.upload.onFileChange(event.target.files);
  };
  const onConsentChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    vm.onConsentChange(event.target.checked);
  };
  return (
    <Stack gap="md">
      <PrivacyNotice message={labels.privacyNotice} testId={TEST_IDS.privacyNotice} />
      <UploadCard
        uploadLabel={labels.upload.label}
        changeButton={labels.upload.changeButton}
        hint={labels.upload.hint}
        cameraLabel={labels.upload.cameraLabel}
        cameraHint={labels.upload.cameraHint}
        previewAlt={labels.upload.previewAlt}
        previewUrl={vm.upload.previewUrl}
        fileError={vm.upload.fileError}
        uploadAccept={UPLOAD_INPUT_ACCEPT}
        cameraAccept={CAMERA_INPUT_ACCEPT}
        cameraCapture={CAMERA_CAPTURE_MODE}
        onFileInputChange={onFileInputChange}
        testId={TEST_IDS.uploadCard}
      />
      <UploadConsent
        consentLabel={labels.upload.consentLabel}
        checked={vm.consentGiven}
        onChange={onConsentChange}
        testId={TEST_IDS.consentCheckbox}
      />
      <Button onClick={vm.onAnalyze} disabled={!vm.canAnalyze} testId={TEST_IDS.analyzeButton}>
        {labels.analyzeButton}
      </Button>
    </Stack>
  );
};

const renderProcessing = (labels: GameScreenLabels): ReactElement => (
  <ProcessingCard
    title={labels.processingText}
    hint={labels.processingHint}
    testId={TEST_IDS.processing}
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

const renderResult = (
  view: GameResultView,
  vm: GameViewModel,
  labels: GameScreenLabels,
): ReactElement => {
  const traitNodes = view.traits.map((trait, index) => (
    <TraitItem
      key={trait.key}
      label={trait.label}
      value={trait.value}
      testId={buildIndexedTestId(TEST_IDS.traitItem, index)}
    />
  ));
  const resultNodes = view.results.map((result) => (
    <ResultCard
      key={result.rank}
      result={result}
      labels={labels.result}
      testId={buildIndexedTestId(TEST_IDS.resultCard, result.rank)}
    />
  ));
  return (
    <Stack gap="md">
      <ResultList
        title={labels.result.title}
        fallbackTitle={labels.result.fallbackTitle}
        fallbackMessage={view.fallbackMessage}
        hasResults={view.hasResults}
        testId={TEST_IDS.resultList}
      >
        {resultNodes}
      </ResultList>
      <TraitList title={labels.result.traitsTitle} testId={TEST_IDS.traitList}>
        {traitNodes}
      </TraitList>
      <ResultDisclaimer disclaimer={view.disclaimer} testId={TEST_IDS.disclaimer} />
      <Stack direction="row" gap="sm" align="center" wrap="wrap">
        {view.hasResults ? (
          <ShareButton
            label={labels.result.shareButton}
            feedback={vm.share.feedback}
            onShare={vm.onShareResult}
            testId={TEST_IDS.shareButton}
          />
        ) : null}
        <RetryButton
          label={labels.result.retryButton}
          onRetry={vm.onRetry}
          testId={TEST_IDS.retryButton}
        />
      </Stack>
    </Stack>
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
      {vm.phase === GamePhase.Setup && renderSetup(vm, labels)}
      {vm.phase === GamePhase.Processing && renderProcessing(labels)}
      {vm.phase === GamePhase.Error &&
        vm.errorMessage !== undefined &&
        renderError(vm.errorMessage, labels.result.retryButton, vm.onRetry)}
      {vm.phase === GamePhase.Success &&
        vm.resultView !== undefined &&
        renderResult(vm.resultView, vm, labels)}
    </Stack>
  );
};
