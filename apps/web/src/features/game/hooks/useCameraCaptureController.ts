'use client';

import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { t } from '@/i18n';
import { captureFrameToFile, requestCameraStream, stopCameraStream } from '@/lib/camera';

export interface CameraCaptureController {
  isOpen: boolean;
  isStarting: boolean;
  errorMessage: string | undefined;
  videoRef: RefObject<HTMLVideoElement | null>;
  open: () => void;
  cancel: () => void;
  capture: () => void;
}

/**
 * Owns the live camera lifecycle: requests the stream when opened, binds it to
 * the video element, captures a frame to a File, and always stops every track
 * on close/unmount so the camera is released. The captured File is handed to
 * onCapture, which routes it through the same validation/preview as an upload.
 */
export const useCameraCaptureController = (
  onCapture: (file: File) => void,
): CameraCaptureController => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | undefined>(undefined);

  const stop = useCallback(() => {
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
      setErrorMessage(undefined);
      try {
        const stream = await requestCameraStream();
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
          setErrorMessage(t('game.cameraError'));
        }
      } finally {
        if (!cancelled) {
          setIsStarting(false);
        }
      }
    };

    void start();
    return (): void => {
      cancelled = true;
      stop();
    };
  }, [isOpen, stop]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const cancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }
    const run = async (): Promise<void> => {
      try {
        const file = await captureFrameToFile(video);
        onCapture(file);
        setIsOpen(false);
      } catch {
        setErrorMessage(t('game.cameraError'));
      }
    };
    void run();
  }, [onCapture]);

  return { isOpen, isStarting, errorMessage, videoRef, open, cancel, capture };
};
