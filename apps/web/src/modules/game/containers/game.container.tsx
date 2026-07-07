'use client';
// client-boundary-reason: owns the analyze mutation, file input state, and image object URL lifecycle through the game hook.

import type { ChangeEventHandler, ReactElement } from 'react';

import { useAppTranslation } from '@/packages/i18n';
import { Button, Stack } from '@/packages/ui-primitives';
import { ErrorState } from '@/shared/components/feedback/error-state.component';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { CameraCapture } from '../components/camera-capture.component';
import { PrivacyNotice } from '../components/privacy-notice.component';
import { UploadCard } from '../components/upload-card.component';
import { UploadConsent } from '../components/upload-consent.component';
import { buildGameScreenLabels, resolveTraitCountLabel } from '../helpers/game-display.helper';
import { useGame } from '../hooks/useGame.hook';
import { UPLOAD_INPUT_ACCEPT } from '../model/game.constants';
import { GamePhase } from '../model/game.enums';
import type { GameScreenLabels, GameViewModel, TranslateMessage } from '../model/game.types';

import { gameTitleClass } from './game.container.variants';
import { GameProcessing } from './game-processing.container';
import { GameResult } from './game-result.container';

const renderCamera = (vm: GameViewModel, labels: GameScreenLabels): ReactElement => (
  <CameraCapture
    title={labels.camera.title}
    previewLabel={labels.camera.previewLabel}
    startingLabel={labels.camera.starting}
    captureButton={labels.camera.captureButton}
    cancelButton={labels.camera.cancelButton}
    isStarting={vm.camera.isStarting}
    errorMessage={vm.camera.errorMessage}
    videoRef={vm.camera.videoRef}
    onCapture={vm.camera.onCapture}
    onCancel={vm.camera.onCancel}
    testId={TEST_IDS.cameraCard}
  />
);

const renderSetup = (vm: GameViewModel, labels: GameScreenLabels): ReactElement => {
  if (vm.camera.isOpen) {
    return renderCamera(vm, labels);
  }

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
        onFileInputChange={onFileInputChange}
        onOpenCamera={vm.camera.onOpen}
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
      {vm.phase === GamePhase.Setup && renderSetup(vm, labels)}
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
          isTranslating={vm.translation.isTranslating}
          translationError={vm.translation.errorMessage}
          shareFeedback={vm.share.feedback}
          onShare={vm.onShareResult}
          onRetry={vm.onRetry}
        />
      )}
    </Stack>
  );
};
