import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FinalGameResult } from '@twinzy/shared';
import { GameStreamEvent, GameStreamStage, StreamStatus } from '@twinzy/shared';

import type { RawResponseLike, SseCapableReplyLike } from '../../../core/http/sse.types';
import { ConcurrencyLimiter, StreamRegistry } from '../../../core/streaming';
import { buildFinalGameResultPayload } from '../../../tests/fixtures/fake-ai-adapter';
import { buildUploadFile } from '../../../tests/fixtures/image-fixtures';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { GameStreamPresenter } from '../api/game-stream.presenter';
import type { AnalyzeGameStreamUseCase } from '../application/analyze-game-stream.use-case';
import type { GameStreamEmitter } from '../lib/game-stream';
import type { GameStreamRequest } from '../model/game-stream.types';

const { useFakeTimers, useRealTimers } = vi;

const TAB = '111e4567-e89b-42d3-a456-426614174000';
const REQ = '222e4567-e89b-42d3-a456-426614174001';

type AnalyzeImpl = (
  file: unknown,
  body: unknown,
  emit: GameStreamEmitter,
  requestId: string,
  signal: AbortSignal,
) => Promise<void>;

class FakeRaw implements RawResponseLike {
  public statusCode = 0;
  public headers: Record<string, string> = {};
  public readonly chunks: string[] = [];
  public writableEnded = false;
  private closeListener: (() => void) | undefined;

  public writeHead(statusCode: number, headers: Record<string, string>): void {
    this.statusCode = statusCode;
    this.headers = headers;
  }

  public write(chunk: string): boolean {
    this.chunks.push(chunk);
    return true;
  }

  public end(): void {
    this.writableEnded = true;
  }

  public on(_event: 'close', listener: () => void): this {
    this.closeListener = listener;
    return this;
  }

  public emitClose(): void {
    this.closeListener?.();
  }
}

class FakeReply implements SseCapableReplyLike {
  public readonly raw = new FakeRaw();
  public hijacked = false;

  public hijack(): void {
    this.hijacked = true;
  }
}

const parseFrames = (raw: FakeRaw): Record<string, unknown>[] =>
  raw.chunks
    .join('')
    .split('\n\n')
    .map((frame) => frame.split('\n').find((line) => line.startsWith('data:')))
    .filter((line): line is string => line !== undefined)
    .map((line) => JSON.parse(line.slice('data:'.length).trim()) as Record<string, unknown>);

const tick = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const buildInput = (
  reply: FakeReply,
  overrides: Partial<GameStreamRequest> = {},
): GameStreamRequest => ({
  file: undefined,
  body: {},
  reply,
  origin: undefined,
  ip: 'ip-1',
  tabId: TAB,
  requestId: REQ,
  ...overrides,
});

const buildHarness = (
  analyze: AnalyzeImpl,
  overrides: Record<string, number> = {},
): { presenter: GameStreamPresenter; limiter: ConcurrencyLimiter; registry: StreamRegistry } => {
  const config = buildConfigStub({
    maxGlobalActiveAnalyses: 10,
    maxActiveAnalysesPerIp: 10,
    maxActiveAnalysesPerTab: 10,
    maxAnalysisQueueSize: 0,
    analysisTimeoutMs: 120_000,
    streamTtlMs: 180_000,
    ...overrides,
  });
  const logger = buildAppLoggerStub().logger;
  const limiter = new ConcurrencyLimiter(config);
  const registry = new StreamRegistry(config, logger);
  const useCase = { analyze } as unknown as AnalyzeGameStreamUseCase;
  const presenter = new GameStreamPresenter(useCase, limiter, registry, config, logger);
  return { presenter, limiter, registry };
};

const emitStageAndResult: AnalyzeImpl = (_file, _body, emit, _requestId) => {
  emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.Validating });
  emit({
    event: GameStreamEvent.Result,
    result: buildFinalGameResultPayload() as unknown as FinalGameResult,
  });
  return Promise.resolve();
};

const emitAcceptedThenResolve: AnalyzeImpl = (_file, _body, emit, _requestId) => {
  emit({ event: GameStreamEvent.Accepted });
  return Promise.resolve();
};

const emitAcceptedThenAwaitAbort: AnalyzeImpl = (_file, _body, emit, _requestId, signal) => {
  emit({ event: GameStreamEvent.Accepted });
  return new Promise((_resolve, reject) => {
    signal.addEventListener(
      'abort',
      () => {
        reject(new Error('aborted'));
      },
      { once: true },
    );
  });
};

const hasEvent = (frames: Record<string, unknown>[], event: string): boolean =>
  frames.some((frame) => frame['event'] === event);

describe('GameStreamPresenter', () => {
  beforeEach(() => {
    useFakeTimers({
      toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date'],
    });
  });

  afterEach(() => {
    useRealTimers();
  });
  it('stamps the correlation envelope + lifecycle status on every frame and cleans up', async () => {
    const { presenter, limiter, registry } = buildHarness(emitStageAndResult);
    const reply = new FakeReply();

    await presenter.stream(buildInput(reply));
    const frames = parseFrames(reply.raw);

    for (const frame of frames) {
      expect(frame['tabId']).toBe(TAB);
      expect(frame['requestId']).toBe(REQ);
      expect(typeof frame['streamId']).toBe('string');
    }
    expect(frames.find((f) => f['event'] === GameStreamEvent.Stage)?.['status']).toBe(
      StreamStatus.Active,
    );
    expect(frames.find((f) => f['event'] === GameStreamEvent.Result)?.['status']).toBe(
      StreamStatus.Completed,
    );
    expect(reply.raw.writableEnded).toBe(true);
    expect(limiter.activeCount).toBe(0);
    expect(registry.activeCount).toBe(0);
  });

  it('rejects with SERVER_BUSY (status rejected) when over capacity, without running the pipeline', async () => {
    const { presenter, limiter } = buildHarness(emitAcceptedThenResolve, {
      maxGlobalActiveAnalyses: 1,
    });
    const held = await limiter.acquire({ ip: 'other', tabId: 'other-tab' });
    expect(held.granted).toBe(true);

    const reply = new FakeReply();
    const file = buildUploadFile();
    await presenter.stream(buildInput(reply, { file }));
    const frames = parseFrames(reply.raw);

    expect(frames).toHaveLength(1);
    expect(frames[0]?.['errorCode']).toBe('SERVER_BUSY');
    expect(frames[0]?.['status']).toBe(StreamStatus.Rejected);
    expect(frames[0]?.['streamId']).toBeUndefined();
    expect(hasEvent(frames, GameStreamEvent.Accepted)).toBe(false);
    expect(reply.raw.writableEnded).toBe(true);
    expect(file.buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('rejects a duplicate in-flight request and releases the slot it briefly held', async () => {
    const { presenter, limiter, registry } = buildHarness(emitAcceptedThenResolve);
    registry.register({
      streamId: 'existing',
      tabId: TAB,
      requestId: REQ,
      controller: new AbortController(),
    });

    const reply = new FakeReply();
    const file = buildUploadFile();
    await presenter.stream(buildInput(reply, { file }));
    const frames = parseFrames(reply.raw);

    expect(frames[0]?.['errorCode']).toBe('SERVER_BUSY');
    expect(frames[0]?.['status']).toBe(StreamStatus.Rejected);
    expect(hasEvent(frames, GameStreamEvent.Accepted)).toBe(false);
    expect(limiter.activeCount).toBe(0);
    expect(file.buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('removes a queued disconnected request and wipes its upload', async () => {
    const analyze = vi.fn(emitAcceptedThenResolve);
    const { presenter, limiter } = buildHarness(analyze, {
      maxGlobalActiveAnalyses: 1,
      maxAnalysisQueueSize: 1,
    });
    const held = await limiter.acquire({ ip: 'other', tabId: 'other-tab' });
    expect(held.granted).toBe(true);
    const reply = new FakeReply();
    const file = buildUploadFile();

    const pending = presenter.stream(buildInput(reply, { file }));
    await tick();
    expect(limiter.queuedCount).toBe(1);
    reply.raw.emitClose();
    await pending;

    expect(limiter.queuedCount).toBe(0);
    expect(analyze).not.toHaveBeenCalled();
    expect(file.buffer.every((byte) => byte === 0)).toBe(true);
    if (held.granted) {
      held.slot.release();
    }
  });

  it('emits a cancelled terminal frame when the run is cancelled through the registry', async () => {
    const { presenter, registry } = buildHarness(emitAcceptedThenAwaitAbort);
    const reply = new FakeReply();

    const pending = presenter.stream(buildInput(reply));
    await tick();
    const accepted = parseFrames(reply.raw).find((f) => f['event'] === GameStreamEvent.Accepted);
    const streamId = accepted?.['streamId'] as string;
    expect(registry.cancel({ streamId, tabId: TAB, requestId: REQ })).toBe(true);
    await pending;

    const error = parseFrames(reply.raw).find((f) => f['event'] === GameStreamEvent.Error);
    expect(error?.['errorCode']).toBe('ANALYSIS_CANCELLED');
    expect(error?.['status']).toBe(StreamStatus.Cancelled);
    expect(registry.activeCount).toBe(0);
  });

  it('stays silent (no error frame) when the client disconnects', async () => {
    const { presenter } = buildHarness(emitAcceptedThenAwaitAbort);
    const reply = new FakeReply();

    const pending = presenter.stream(buildInput(reply));
    await tick();
    reply.raw.emitClose();
    await pending;

    const frames = parseFrames(reply.raw);
    expect(hasEvent(frames, GameStreamEvent.Error)).toBe(false);
    expect(hasEvent(frames, GameStreamEvent.Accepted)).toBe(true);
  });

  it('aborts with an AI_TIMEOUT failure when the watchdog fires', async () => {
    const { presenter } = buildHarness(emitAcceptedThenAwaitAbort, { analysisTimeoutMs: 20 });
    const reply = new FakeReply();

    const pending = presenter.stream(buildInput(reply));
    await vi.advanceTimersByTimeAsync(20);
    await pending;

    const error = parseFrames(reply.raw).find((f) => f['event'] === GameStreamEvent.Error);
    expect(error?.['errorCode']).toBe('AI_TIMEOUT');
    expect(error?.['status']).toBe(StreamStatus.Failed);
  });
});
