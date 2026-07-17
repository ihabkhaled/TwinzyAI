import type { ReactElement } from 'react';

import { Alert, Button, Card } from '@/packages/ui-primitives';

import { CAPTIONS_TRACK_KIND } from '../model/game.constants';
import type { CameraCaptureProps } from '../model/game-component.types';

import {
  cameraActionsClass,
  cameraErrorClass,
  cameraStageClass,
  cameraStartingClass,
  cameraTitleClass,
  resolveCameraVideoClass,
} from './camera-capture.variants';
import { CameraControls } from './camera-controls.component';

/**
 * Live camera preview with Capture/Cancel actions. Pure composition: the video
 * ref, busy/error state, and handlers all arrive as props from the container.
 * The <video> carries an empty captions track so it satisfies a11y with no
 * audio (and no lint suppression, which the repo bans outright).
 */
export function CameraCapture({
  title,
  previewLabel,
  startingLabel,
  captureButton,
  cancelButton,
  switchButton,
  mirrorButton,
  isStarting,
  isMirrored,
  errorMessage,
  videoRef,
  onCapture,
  onCancel,
  onSwitchCamera,
  onToggleMirror,
  testId,
}: Readonly<CameraCaptureProps>): ReactElement {
  return (
    <Card testId={testId}>
      <p className={cameraTitleClass}>{title}</p>
      <div className={cameraStageClass}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label={previewLabel}
          className={resolveCameraVideoClass(isMirrored)}
        >
          <track kind={CAPTIONS_TRACK_KIND} />
        </video>
      </div>
      {isStarting ? <p className={cameraStartingClass}>{startingLabel}</p> : null}
      {errorMessage !== undefined && (
        <Alert tone="danger" className={cameraErrorClass}>
          {errorMessage}
        </Alert>
      )}
      <CameraControls
        switchButton={switchButton}
        mirrorButton={mirrorButton}
        isMirrored={isMirrored}
        onSwitchCamera={onSwitchCamera}
        onToggleMirror={onToggleMirror}
      />
      <div className={cameraActionsClass}>
        <Button onClick={onCapture} disabled={isStarting}>
          {captureButton}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          {cancelButton}
        </Button>
      </div>
    </Card>
  );
}
