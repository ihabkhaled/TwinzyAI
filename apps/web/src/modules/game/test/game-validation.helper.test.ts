import { describe, expect, it } from 'vitest';

import { ERROR_MESSAGE_KEYS } from '@/shared/errors/error-keys.constants';

import { validateImageFile } from '../helpers/game-validation.helper';

import { buildImageFile } from './game-fixtures';

describe('validateImageFile', () => {
  it('accepts a valid JPG under the size limit', () => {
    expect(validateImageFile(buildImageFile())).toEqual({ ok: true });
  });

  it('rejects a missing file as a validation error', () => {
    expect(validateImageFile()).toEqual({ ok: false, errorKey: ERROR_MESSAGE_KEYS.validation });
  });

  it('rejects a disallowed MIME type as an upload error', () => {
    expect(validateImageFile(buildImageFile('photo.jpg', 'image/gif'))).toEqual({
      ok: false,
      errorKey: ERROR_MESSAGE_KEYS.upload,
    });
  });

  it('rejects a disallowed extension even with an allowed MIME', () => {
    expect(validateImageFile(buildImageFile('photo.heic', 'image/jpeg'))).toEqual({
      ok: false,
      errorKey: ERROR_MESSAGE_KEYS.upload,
    });
  });

  it('rejects an oversized file as an upload error', () => {
    expect(validateImageFile(buildImageFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024))).toEqual({
      ok: false,
      errorKey: ERROR_MESSAGE_KEYS.upload,
    });
  });
});
