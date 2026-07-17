import type { RefObject } from 'react';

import type { CameraFacingMode } from '@/packages/camera';

/** Facing mode + mirror state and their toggles (owned by useCameraSettings). */
export interface CameraSettings {
  facingMode: CameraFacingMode;
  isMirrored: boolean;
  switchCamera: () => void;
  toggleMirror: () => void;
}

/**
 * The live-camera controller surface the capture hook exposes. Holds the raw
 * error KEY (not translated copy) so the hook stays React-i18n-free, mirroring
 * {@link UploadController}; the orchestrator translates it at the boundary.
 */
export interface CameraController {
  isOpen: boolean;
  isStarting: boolean;
  errorKey: string | undefined;
  /** Whether the preview (and the captured photo) are horizontally flipped. */
  isMirrored: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  open: () => void;
  cancel: () => void;
  capture: () => void;
  /** Flip between the front (`user`) and back (`environment`) camera. */
  switchCamera: () => void;
  /** Toggle the horizontal mirror of the preview and captured photo. */
  toggleMirror: () => void;
}

/** The live-camera sub-view the container renders (error already translated). */
export interface CameraViewModel {
  isOpen: boolean;
  isStarting: boolean;
  errorMessage: string | undefined;
  isMirrored: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onOpen: () => void;
  onCancel: () => void;
  onCapture: () => void;
  onSwitchCamera: () => void;
  onToggleMirror: () => void;
}
