import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { ErrorStreamMessage, GameStreamMessage, ResultStreamMessage } from '@twinzy/shared';
import {
  FinalGameResultSchema,
  GameStreamEvent,
  GameStreamMessageSchema,
  GameStreamStage,
  RESULT_DISCLAIMER,
} from '@twinzy/shared';

import { AppModule } from '../app.module';
import { createTestApp } from '../bootstrap/create-test-app';
import { AI_PROVIDER_ADAPTER } from '../modules/ai';
import { ClamAvAdapter } from '../modules/file-security/adapters/clamav.adapter';

import {
  buildCandidatesJson,
  buildJudgeJson,
  buildTraitExtractionJson,
  FakeAiAdapter,
} from './fixtures/fake-ai-adapter';
import { buildJpegBuffer } from './fixtures/image-fixtures';
import { buildCleanClamAvStub } from './fixtures/stubs';

const STREAM_PATH = '/api/v1/game/analyze/stream';

/** Parses a buffered SSE body into validated protocol messages. */
const parseStream = (body: string): GameStreamMessage[] =>
  body
    .split('\n\n')
    .map((frame) => frame.split('\n').find((line) => line.startsWith('data:')))
    .filter((line): line is string => line !== undefined)
    .map((line) => GameStreamMessageSchema.parse(JSON.parse(line.slice('data:'.length).trim())));

const isResultMessage = (message: GameStreamMessage): message is ResultStreamMessage =>
  message.event === GameStreamEvent.Result;

const isErrorMessage = (message: GameStreamMessage): message is ErrorStreamMessage =>
  message.event === GameStreamEvent.Error;

describe('POST /api/v1/game/analyze/stream (integration)', () => {
  let app: INestApplication;
  let adapter: FakeAiAdapter;

  beforeAll(async () => {
    adapter = new FakeAiAdapter();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_PROVIDER_ADAPTER)
      .useValue(adapter)
      .overrideProvider(ClamAvAdapter)
      .useValue(buildCleanClamAvStub())
      .compile();

    app = await createTestApp(moduleRef);
  });

  afterEach(() => {
    adapter.imageCalls.length = 0;
    adapter.textCalls.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  const server = (): Server => app.getHttpServer();

  const postImage = (consent: boolean): request.Test => {
    const req = request(server()).post(STREAM_PATH);
    if (consent) {
      void req.field('consent', 'true');
    }
    return req.attach('image', buildJpegBuffer(), {
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
    });
  };

  it('streams an event/stream response, not JSON', async () => {
    adapter.queueImageResponse(buildTraitExtractionJson());
    adapter.queueTextResponse(buildCandidatesJson());
    adapter.queueTextResponse(buildJudgeJson());

    const response = await postImage(true).expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
  });

  it('emits accepted → ordered stages → result on the happy path', async () => {
    adapter.queueImageResponse(buildTraitExtractionJson());
    adapter.queueTextResponse(buildCandidatesJson());
    adapter.queueTextResponse(buildJudgeJson());

    const response = await postImage(true).expect(200);
    const messages = parseStream(response.text);
    const stages = messages
      .filter((message) => message.event === GameStreamEvent.Stage)
      .map((message) => message.stage);

    expect(messages[0]?.event).toBe(GameStreamEvent.Accepted);
    expect(stages).toEqual([
      GameStreamStage.Validating,
      GameStreamStage.ExtractingTraits,
      GameStreamStage.GeneratingCandidates,
      GameStreamStage.Judging,
      GameStreamStage.Aggregating,
    ]);

    const resultMessage = messages.find((message): message is ResultStreamMessage =>
      isResultMessage(message),
    );
    expect(messages.at(-1)?.event).toBe(GameStreamEvent.Result);
    expect(FinalGameResultSchema.safeParse(resultMessage?.result).success).toBe(true);
    expect(resultMessage?.result.disclaimer).toBe(RESULT_DISCLAIMER);
  });

  it('sends the image only to trait extraction; text stages never carry it', async () => {
    adapter.queueImageResponse(buildTraitExtractionJson());
    adapter.queueTextResponse(buildCandidatesJson());
    adapter.queueTextResponse(buildJudgeJson());

    await postImage(true).expect(200);

    expect(adapter.imageCalls).toHaveLength(1);
    expect(adapter.textCalls).toHaveLength(2);
    const base64Marker = buildJpegBuffer().toString('base64').slice(0, 24);
    for (const prompt of adapter.textCalls) {
      expect(prompt).not.toContain(base64Marker);
    }
  });

  it('emits a safe in-band error event when consent is missing, with no result', async () => {
    const response = await postImage(false).expect(200);
    const messages = parseStream(response.text);
    const errorMessage = messages.find((message): message is ErrorStreamMessage =>
      isErrorMessage(message),
    );

    expect(errorMessage?.errorCode).toBe('CONSENT_REQUIRED');
    expect(messages.some((message) => isResultMessage(message))).toBe(false);
    expect(adapter.imageCalls).toHaveLength(0);
  });

  it('emits a safe error event without leaking provider details on failure', async () => {
    adapter.queueImageResponse(new Error('raw provider stack trace with apiKey=abc123'));

    const response = await postImage(true).expect(200);

    expect(response.text).not.toContain('apiKey');
    expect(response.text).not.toContain('stack');
    const messages = parseStream(response.text);
    expect(messages.some((message) => isErrorMessage(message))).toBe(true);
  });
});
