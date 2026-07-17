'use client';
// client-boundary-reason: holds React state for the live-camera facing mode and mirror toggle.

import { useCallback, useState } from 'react';

import { CAMERA_FACING_MODES, DEFAULT_CAMERA_FACING_MODE } from '@/packages/camera';

import type { CameraSettings } from '../model/game.types';

/**
 * Owns the two user-controlled camera settings: which physical camera is open
 * (front/back) and whether the preview + captured photo are horizontally
 * mirrored. Split from {@link useCameraCapture} so the capture hook stays focused
 * on the MediaStream lifecycle.
 */
export const useCameraSettings = (): CameraSettings => {
  const [facingMode, setFacingMode] = useState(DEFAULT_CAMERA_FACING_MODE);
  const [isMirrored, setIsMirrored] = useState(false);

  const switchCamera = useCallback((): void => {
    setFacingMode((current) =>
      current === CAMERA_FACING_MODES.Back ? CAMERA_FACING_MODES.Front : CAMERA_FACING_MODES.Back,
    );
  }, []);

  const toggleMirror = useCallback((): void => {
    setIsMirrored((current) => !current);
  }, []);

  return { facingMode, isMirrored, switchCamera, toggleMirror };
};
