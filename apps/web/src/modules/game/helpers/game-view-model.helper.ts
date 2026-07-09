import type {
  CameraController,
  CameraViewModel,
  ShareFeedbackInput,
  ShareViewModel,
  TranslateMessage,
  TranslationViewModel,
  UploadViewModel,
  UploadViewModelInput,
} from '../model/game.types';

import { translateOptionalKey } from './game-display.helper';

/** Build the upload sub-view with translated error copy. */
export const buildUploadViewModel = (
  upload: UploadViewModelInput,
  previewUrl: string | undefined,
  translate: TranslateMessage,
): UploadViewModel => ({
  file: upload.file,
  previewUrl,
  fileError: translateOptionalKey(translate, upload.fileErrorKey),
  onFileChange: upload.onFileChange,
  clearFile: upload.clearFile,
});

/** Build the camera sub-view with translated error copy. */
export const buildCameraViewModel = (
  camera: CameraController,
  translate: TranslateMessage,
): CameraViewModel => ({
  isOpen: camera.isOpen,
  isStarting: camera.isStarting,
  errorMessage: translateOptionalKey(translate, camera.errorKey),
  videoRef: camera.videoRef,
  onOpen: camera.open,
  onCancel: camera.cancel,
  onCapture: camera.capture,
});

/** Build the share sub-view with translated feedback copy. */
export const buildShareViewModel = (
  share: ShareFeedbackInput,
  translate: TranslateMessage,
): ShareViewModel => ({
  feedback: translateOptionalKey(translate, share.feedbackKey),
});

/** Build the translation status sub-view with translated error copy. */
export const buildTranslationViewModel = (
  translation: {
    isTranslating: boolean;
    errorKey: string | undefined;
    retry: () => void;
  },
  translate: TranslateMessage,
): TranslationViewModel => ({
  isTranslating: translation.isTranslating,
  errorMessage: translateOptionalKey(translate, translation.errorKey),
  canRetry: translation.errorKey !== undefined,
  onRetry: translation.retry,
});
