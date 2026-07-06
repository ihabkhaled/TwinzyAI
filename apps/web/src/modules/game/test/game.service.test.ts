import { beforeEach, describe, expect, it, vi } from 'vitest';

import { postMultipart } from '@/packages/axios';
import { AppError } from '@/shared/errors/app-error';
import { ERROR_MESSAGE_KEYS } from '@/shared/errors/error-keys.constants';

import { analyzeImage, validateFileForUpload } from '../services/game.service';

import { buildFinalResult, buildImageFile } from './game-fixtures';

vi.mock('@/packages/axios', () => ({
  httpClient: {},
  postMultipart: vi.fn(),
}));

const postMultipartMock = vi.mocked(postMultipart);

describe('analyzeImage', () => {
  beforeEach(() => {
    postMultipartMock.mockReset();
  });

  it('validates the file then posts the multipart request', async () => {
    const result = buildFinalResult();
    postMultipartMock.mockResolvedValue(result);

    await expect(analyzeImage(buildImageFile())).resolves.toEqual(result);
    expect(postMultipartMock).toHaveBeenCalledTimes(1);
  });

  it('throws an AppError for an invalid file without calling the gateway', async () => {
    await expect(analyzeImage(buildImageFile('bad.gif', 'image/gif'))).rejects.toBeInstanceOf(
      AppError,
    );
    expect(postMultipartMock).not.toHaveBeenCalled();
  });
});

describe('validateFileForUpload', () => {
  it('accepts a valid file and flags an oversized one', () => {
    expect(validateFileForUpload(buildImageFile())).toEqual({ ok: true });
    expect(validateFileForUpload(buildImageFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024))).toEqual(
      { ok: false, errorKey: ERROR_MESSAGE_KEYS.upload },
    );
  });
});
