import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GameStreamStageValue } from '@twinzy/shared';
import { GameStreamEvent, GameStreamStage } from '@twinzy/shared';

import * as axiosPackage from '@/packages/axios';

import { analyzeImageStreamRequest } from '../gateway/game-stream.gateway';
import type { GameStreamHandlers } from '../model/game.types';

import { buildFinalResult, buildImageFile } from './game-fixtures';

vi.mock('@/packages/axios', async (importActual) => {
  const actual = await importActual<typeof axiosPackage>();
  return { ...actual, streamMultipart: vi.fn() };
});

const streamMultipartMock = vi.mocked(axiosPackage.streamMultipart);

/** Drive the mocked transport with a fixed sequence of raw SSE data frames. */
const feed = (frames: readonly string[]): void => {
  streamMultipartMock.mockImplementation((_path, _formData, onData) => {
    for (const frame of frames) {
      onData(frame);
    }
    return Promise.resolve();
  });
};

const encode = (message: unknown): string => JSON.stringify(message);

const buildHandlers = (): {
  handlers: GameStreamHandlers;
  stages: GameStreamStageValue[];
} => {
  const stages: GameStreamStageValue[] = [];
  const handlers: GameStreamHandlers = {
    onStage: (stage) => {
      stages.push(stage);
    },
  };
  return { handlers, stages };
};

const capture = async (call: () => Promise<unknown>): Promise<unknown> => {
  try {
    await call();
  } catch (error) {
    return error;
  }
  return undefined;
};

describe('analyzeImageStreamRequest', () => {
  beforeEach(() => {
    streamMultipartMock.mockReset();
  });

  it('forwards each stage and resolves with the final result', async () => {
    const result = buildFinalResult();
    feed([
      encode({ event: GameStreamEvent.Stage, stage: GameStreamStage.Validating }),
      encode({ event: GameStreamEvent.Stage, stage: GameStreamStage.Judging }),
      encode({ event: GameStreamEvent.Result, result }),
    ]);
    const { handlers, stages } = buildHandlers();

    await expect(analyzeImageStreamRequest(buildImageFile(), handlers)).resolves.toEqual(result);
    expect(stages).toEqual([GameStreamStage.Validating, GameStreamStage.Judging]);
  });

  it('ignores heartbeat and malformed frames while collecting the result', async () => {
    const result = buildFinalResult();
    feed([
      'not-json',
      encode({ event: GameStreamEvent.Heartbeat }),
      encode({ event: 'unknown-event' }),
      encode({ event: GameStreamEvent.Result, result }),
    ]);
    const { handlers, stages } = buildHandlers();

    await expect(analyzeImageStreamRequest(buildImageFile(), handlers)).resolves.toEqual(result);
    expect(stages).toEqual([]);
  });

  it('throws an HttpError carrying the backend errorCode on a terminal error frame', async () => {
    feed([
      encode({ event: GameStreamEvent.Stage, stage: GameStreamStage.ExtractingTraits }),
      encode({ event: GameStreamEvent.Error, errorCode: 'RATE_LIMITED', message: 'slow down' }),
    ]);
    const { handlers } = buildHandlers();

    const error = await capture(() => analyzeImageStreamRequest(buildImageFile(), handlers));

    expect(axiosPackage.isHttpError(error)).toBe(true);
    expect((error as axiosPackage.HttpError).responseBody).toStrictEqual({
      errorCode: 'RATE_LIMITED',
      message: 'slow down',
    });
  });

  it('throws an HttpError when the stream ends without a result', async () => {
    feed([encode({ event: GameStreamEvent.Stage, stage: GameStreamStage.Aggregating })]);
    const { handlers } = buildHandlers();

    const error = await capture(() => analyzeImageStreamRequest(buildImageFile(), handlers));

    expect(axiosPackage.isHttpError(error)).toBe(true);
  });
});
