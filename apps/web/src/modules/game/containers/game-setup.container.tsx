import type { ChangeEventHandler, ReactElement } from 'react';

import { Button, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { CameraCapture } from '../components/camera-capture.component';
import { PrivacyNotice } from '../components/privacy-notice.component';
import { ResultCountSelect } from '../components/result-count-select.component';
import { UploadCard } from '../components/upload-card.component';
import { UploadConsent } from '../components/upload-consent.component';
import { RESULT_COUNT_INPUT_ID, UPLOAD_INPUT_ACCEPT } from '../model/game.constants';
import type { GameScreenLabels, GameViewModel } from '../model/game.types';
import type { GameSetupProps } from '../model/game-component.types';

/** The live-camera capture card, shown while the camera source is open. */
const renderCamera = (vm: GameViewModel, labels: GameScreenLabels): ReactElement => (
  <CameraCapture
    title={labels.camera.title}
    previewLabel={labels.camera.previewLabel}
    startingLabel={labels.camera.starting}
    captureButton={labels.camera.captureButton}
    cancelButton={labels.camera.cancelButton}
    switchButton={labels.camera.switchButton}
    mirrorButton={labels.camera.mirrorButton}
    isStarting={vm.camera.isStarting}
    isMirrored={vm.camera.isMirrored}
    errorMessage={vm.camera.errorMessage}
    videoRef={vm.camera.videoRef}
    onCapture={vm.camera.onCapture}
    onCancel={vm.camera.onCancel}
    onSwitchCamera={vm.camera.onSwitchCamera}
    onToggleMirror={vm.camera.onToggleMirror}
    testId={TEST_IDS.cameraCard}
  />
);

/**
 * The setup-phase view: either the live camera, or the privacy note + photo
 * source card + consent + analyze action. A container so it may translate the
 * DOM change events into the view-model's file/consent handlers.
 */
export const GameSetup = ({ vm, labels }: GameSetupProps): ReactElement => {
  if (vm.camera.isOpen) {
    return renderCamera(vm, labels);
  }

  const onFileInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    vm.upload.onFileChange(event.target.files);
  };
  const onConsentChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    vm.onConsentChange(event.target.checked);
  };
  const onResultCountChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    vm.onResultCountChange(Number(event.target.value));
  };
  const sourceLabel =
    vm.upload.previewUrl === undefined ? labels.upload.label : labels.upload.changeButton;
  return (
    <Stack gap="md">
      <PrivacyNotice message={labels.privacyNotice} testId={TEST_IDS.privacyNotice} />
      <UploadCard
        sourceLabel={sourceLabel}
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
      <ResultCountSelect
        id={RESULT_COUNT_INPUT_ID}
        label={labels.resultCount.label}
        hint={labels.resultCount.hint}
        value={vm.resultCount}
        onChange={onResultCountChange}
        testId={TEST_IDS.resultCountSelect}
      >
        {vm.resultCountOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </ResultCountSelect>
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
