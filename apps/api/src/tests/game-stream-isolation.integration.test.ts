import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { GameStreamMessage } from '@twinzy/shared';
import {
  GAME_ANALYZE_STREAM_PATH,
  GAME_CANCEL_PATH,
  GameStreamEvent,
  GameStreamMessageSchema,
  STREAM_ID_HEADERS,
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

const TAB_ID = '111e4567-e89b-42d3-a456-426614174000';
const REQUEST_ID = '222e4567-e89b-42d3-a456-426614174001';
const STREAM_ID = '333e4567-e89b-42d3-a456-426614174002';

const parseStream = (body: string): GameStreamMessage[] =>
  body
    .split('\n\n')
    .map((frame) => frame.split('\n').find((line) => line.startsWith('data:')))
    .filter((line): line is string => line !== undefined)
    .map((line) => GameStreamMessageSchema.parse(JSON.parse(line.slice('data:'.length).trim())));

describe('streaming isolation + cancellation (integration)', () => {
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

  afterAll(async () => {
    await app.close();
  });

  const server = (): Server => app.getHttpServer();

  it('echoes the client tab/request ids and mints a streamId + status on every frame', async () => {
    adapter.queueImageResponse(buildTraitExtractionJson());
    adapter.queueTextResponse(buildCandidatesJson());
    adapter.queueTextResponse(buildJudgeJson());

    const response = await request(server())
      .post(GAME_ANALYZE_STREAM_PATH)
      .field('consent', 'true')
      .set(STREAM_ID_HEADERS.tabId, TAB_ID)
      .set(STREAM_ID_HEADERS.requestId, REQUEST_ID)
      .attach('image', buildJpegBuffer(), { filename: 'photo.jpg', contentType: 'image/jpeg' })
      .expect(200);

    const frames = parseStream(response.text);
    const accepted = frames.find((frame) => frame.event === GameStreamEvent.Accepted);

    expect(accepted?.tabId).toBe(TAB_ID);
    expect(accepted?.requestId).toBe(REQUEST_ID);
    expect(typeof accepted?.streamId).toBe('string');
    expect(accepted?.status).toBe('active');
    for (const frame of frames) {
      expect(frame.tabId).toBe(TAB_ID);
      expect(frame.requestId).toBe(REQUEST_ID);
    }
    expect(frames.at(-1)?.status).toBe('completed');
  });

  it('cancel endpoint reports cancelled:false for a stream that is not running', async () => {
    const response = await request(server())
      .post(GAME_CANCEL_PATH)
      .send({ tabId: TAB_ID, requestId: REQUEST_ID, streamId: STREAM_ID })
      .expect(201);

    expect(response.body).toEqual({ cancelled: false });
  });

  it('cancel endpoint rejects a malformed body', async () => {
    const response = await request(server()).post(GAME_CANCEL_PATH).send({ tabId: 'not-a-uuid' });

    expect(response.status).toBe(400);
  });
});
