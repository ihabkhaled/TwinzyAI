import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GameStreamStageValue } from '@twinzy/shared';
import { GameStreamEvent, GameStreamStage } from '@twinzy/shared';

import * as axiosPackage from '@/packages/axios';
import { AppError } from '@/shared/errors/app-error';
import { ERROR_MESSAGE_KEYS } from '@/shared/errors/error-keys.constants';

import { analyzeImage, analyzeImageStream, validateFileForUpload } from '../services/game.service';

import { buildFinalResult, buildImageFile } from './game-fixtures';

vi.mock('@/packages/axios', async (importActual) => {
  const actual = await importActual<typeof axiosPackage>();
  return { ...actual, postMultipart: vi.fn(), streamMultipart: vi.fn() };
});

const postMultipartMock = vi.mocked(axiosPackage.postMultipart);
const streamMultipartMock = vi.mocked(axiosPackage.streamMultipart);

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

describe('analyzeImageStream', () => {
  beforeEach(() => {
    streamMultipartMock.mockReset();
  });

  it('validates the file, reports each stage, and resolves with the streamed result', async () => {
    const result = buildFinalResult();
    streamMultipartMock.mockImplementation((_path, _formData, onData) => {
      onData(JSON.stringify({ event: GameStreamEvent.Stage, stage: GameStreamStage.Judging }));
      onData(JSON.stringify({ event: GameStreamEvent.Result, result }));
      return Promise.resolve();
    });
    const stages: GameStreamStageValue[] = [];

    await expect(
      analyzeImageStream(buildImageFile(), (stage) => {
        stages.push(stage);
      }),
    ).resolves.toEqual(result);
    expect(stages).toEqual([GameStreamStage.Judging]);
  });

  it('throws an AppError for an invalid file without opening the stream', async () => {
    await expect(
      analyzeImageStream(buildImageFile('bad.gif', 'image/gif'), vi.fn()),
    ).rejects.toBeInstanceOf(AppError);
    expect(streamMultipartMock).not.toHaveBeenCalled();
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
