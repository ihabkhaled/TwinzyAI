import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ERROR_MESSAGE_KEYS } from '@/shared/errors/error-keys.constants';

import {
  buildCameraViewModel,
  buildShareViewModel,
  buildTranslationViewModel,
  buildUploadViewModel,
} from '../helpers/game-view-model.helper';

import { fakeTranslate } from './game-fixtures';

describe('game view-model helpers', () => {
  it('maps upload and camera controllers with translated errors', () => {
    const onFileChange = vi.fn();
    const clearFile = vi.fn();
    const upload = buildUploadViewModel(
      { file: undefined, fileErrorKey: ERROR_MESSAGE_KEYS.upload, onFileChange, clearFile },
      'blob:preview',
      fakeTranslate,
    );
    expect(upload.fileError).toBe(ERROR_MESSAGE_KEYS.upload);
    expect(upload.previewUrl).toBe('blob:preview');

    const camera = buildCameraViewModel(
      {
        isOpen: true,
        isStarting: false,
        errorKey: ERROR_MESSAGE_KEYS.generic,
        isMirrored: false,
        videoRef: createRef<HTMLVideoElement>(),
        open: vi.fn(),
        cancel: vi.fn(),
        capture: vi.fn(),
        switchCamera: vi.fn(),
        toggleMirror: vi.fn(),
      },
      fakeTranslate,
    );
    expect(camera.errorMessage).toBe(ERROR_MESSAGE_KEYS.generic);
    expect(camera.isOpen).toBe(true);
    expect(camera.isMirrored).toBe(false);
  });

  it('maps optional share and translation feedback', () => {
    expect(buildShareViewModel({ feedbackKey: undefined }, fakeTranslate).feedback).toBeUndefined();
    expect(buildShareViewModel({ feedbackKey: 'share.copied' }, fakeTranslate).feedback).toBe(
      'share.copied',
    );

    const retry = vi.fn();
    expect(
      buildTranslationViewModel(
        { isTranslating: false, errorKey: 'errors.translation', retry },
        fakeTranslate,
      ),
    ).toEqual({
      isTranslating: false,
      errorMessage: 'errors.translation',
      canRetry: true,
      onRetry: retry,
    });
  });
});
