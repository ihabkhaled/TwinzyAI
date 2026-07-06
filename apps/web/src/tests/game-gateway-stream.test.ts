import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GameStreamStage } from '@twinzy/shared';

import { analyzeImageStreamRequest } from '@/features/game/gateways/game.gateway';
import type * as HttpModule from '@/lib/http';
import { HttpClientError, postMultipartStream } from '@/lib/http';

import { buildFinalResult, buildImageFile } from './fixtures/game-fixtures';

vi.mock('@/lib/http', async (importOriginal) => {
  const actual = await importOriginal<typeof HttpModule>();
  return { ...actual, postMultipartStream: vi.fn() };
});

const mockedStream = vi.mocked(postMultipartStream);

const frame = (message: unknown): string => JSON.stringify(message);

beforeEach(() => {
  mockedStream.mockReset();
});

describe('analyzeImageStreamRequest', () => {
  it('reports each stage and resolves with the final result', async () => {
    const result = buildFinalResult();
    mockedStream.mockImplementation((_path, _formData, onData) => {
      onData(frame({ event: 'accepted' }));
      onData(frame({ event: 'stage', stage: GameStreamStage.ExtractingTraits }));
      onData(frame({ event: 'stage', stage: GameStreamStage.Judging }));
      onData(frame({ event: 'result', result }));
      return Promise.resolve();
    });

    const stages: string[] = [];
    const returned = await analyzeImageStreamRequest(buildImageFile(), {
      onStage: (stage) => stages.push(stage),
    });

    expect(stages).toEqual([GameStreamStage.ExtractingTraits, GameStreamStage.Judging]);
    expect(returned).toEqual(result);
  });

  it('throws a typed HttpClientError carrying the errorCode on an error event', async () => {
    mockedStream.mockImplementation((_path, _formData, onData) => {
      onData(frame({ event: 'stage', stage: GameStreamStage.Validating }));
      onData(frame({ event: 'error', errorCode: 'AI_RATE_LIMITED', message: 'busy' }));
      return Promise.resolve();
    });

    let caught: unknown;
    try {
      await analyzeImageStreamRequest(buildImageFile(), { onStage: vi.fn() });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpClientError);
    expect((caught as HttpClientError).errorCode).toBe('AI_RATE_LIMITED');
  });

  it('throws when the stream ends without a result', async () => {
    mockedStream.mockImplementation((_path, _formData, onData) => {
      onData(frame({ event: 'accepted' }));
      return Promise.resolve();
    });

    await expect(
      analyzeImageStreamRequest(buildImageFile(), { onStage: vi.fn() }),
    ).rejects.toBeInstanceOf(HttpClientError);
  });

  it('ignores malformed frames without crashing', async () => {
    const result = buildFinalResult();
    mockedStream.mockImplementation((_path, _formData, onData) => {
      onData('not json');
      onData(frame({ event: 'unknown-thing' }));
      onData(frame({ event: 'result', result }));
      return Promise.resolve();
    });

    await expect(
      analyzeImageStreamRequest(buildImageFile(), { onStage: vi.fn() }),
    ).resolves.toEqual(result);
  });
});
