import type { ReactElement } from 'react';

import { Button } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import type { CameraControlsProps } from '../model/game-component.types';

import { cameraControlsClass } from './camera-capture.variants';

/**
 * The camera controls row: switch between the front/back camera and toggle the
 * horizontal mirror. Split out of {@link CameraCapture} to keep that card under
 * the component-size cap; pure composition (labels + handlers in, JSX out).
 */
export function CameraControls({
  switchButton,
  mirrorButton,
  isMirrored,
  onSwitchCamera,
  onToggleMirror,
}: Readonly<CameraControlsProps>): ReactElement {
  return (
    <div className={cameraControlsClass}>
      <Button variant="ghost" size="sm" onClick={onSwitchCamera} testId={TEST_IDS.cameraSwitch}>
        {switchButton}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleMirror}
        aria-pressed={isMirrored}
        testId={TEST_IDS.cameraMirror}
      >
        {mirrorButton}
      </Button>
    </div>
  );
}
