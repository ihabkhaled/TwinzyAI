'use client';
// client-boundary-reason: owns the live camera MediaStream lifecycle (request, bind to the <video>, capture a frame, and release every track on cancel/unmount) — all browser-only.

import { useCallback, useEffect, useRef, useState } from 'react';

import { captureFrameToFile, requestCameraStream, stopCameraStream } from '@/packages/camera';

import { CAMERA_ERROR_MESSAGE_KEY } from '../model/game.constants';
import type { CameraController } from '../model/game.types';

import { useCameraSettings } from './useCameraSettings.hook';

/**
 * Owns the live camera lifecycle: requests the stream when opened, binds it to
 * the video element, captures a frame to a File, and ALWAYS stops every track
 * on close/unmount so the camera light turns off and the device is released.
 * The captured File is handed to `onCapture`, which routes it through the exact
 * same validation + preview path as a picked upload.
 */
export const useCameraCapture = (onCapture: (file: File) => void): CameraController => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | undefined>();
  const { facingMode, ...cameraSettings } = useCameraSettings();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | undefined>(undefined);

  const stop = useCallback((): void => {
    stopCameraStream(streamRef.current);
    streamRef.current = undefined;
    if (videoRef.current !== null) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    const start = async (): Promise<void> => {
      setIsStarting(true);
      setErrorKey(undefined);
      try {
        const stream = await requestCameraStream(facingMode);
        if (cancelled) {
          stopCameraStream(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current !== null) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) {
          setErrorKey(CAMERA_ERROR_MESSAGE_KEY);
        }
      } finally {
        if (!cancelled) {
          setIsStarting(false);
        }
      }
    };
    void start();
    // facingMode in the deps re-acquires the stream on switch; cleanup stops the old one.
    return (): void => {
      cancelled = true;
      stop();
    };
  }, [isOpen, stop, facingMode]);

  const open = useCallback((): void => {
    setIsOpen(true);
  }, []);

  const cancel = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const capture = useCallback((): void => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }
    const run = async (): Promise<void> => {
      try {
        const file = await captureFrameToFile(video, cameraSettings.isMirrored);
        onCapture(file);
        setIsOpen(false);
      } catch {
        setErrorKey(CAMERA_ERROR_MESSAGE_KEY);
      }
    };
    void run();
  }, [onCapture, cameraSettings.isMirrored]);

  return { isOpen, isStarting, errorKey, videoRef, open, cancel, capture, ...cameraSettings };
};
