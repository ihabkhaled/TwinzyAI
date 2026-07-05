import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { API_GLOBAL_PREFIX, FinalGameResultSchema, RESULT_DISCLAIMER } from '@twinzy/shared';

import { AppModule } from '../app.module';
import { AI_PROVIDER_ADAPTER } from '../modules/ai/interfaces/ai-provider-adapter.interface';

import {
  buildCandidatesJson,
  buildJudgeJson,
  buildTraitExtractionJson,
  FakeAiAdapter,
} from './fixtures/fake-ai-adapter';
import { buildJpegBuffer, buildPngBuffer } from './fixtures/image-fixtures';

const ANALYZE_PATH = '/api/v1/game/analyze';

describe('POST /api/v1/game/analyze (integration)', () => {
  let app: INestApplication;
  let adapter: FakeAiAdapter;

  beforeAll(async () => {
    adapter = new FakeAiAdapter();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_PROVIDER_ADAPTER)
      .useValue(adapter)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(API_GLOBAL_PREFIX);
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterEach(() => {
    adapter.imageCalls.length = 0;
    adapter.textCalls.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  const server = (): Server => app.getHttpServer() as Server;

  it('returns a schema-valid final result on the happy path', async () => {
    adapter.queueImageResponse(buildTraitExtractionJson());
    adapter.queueTextResponse(buildCandidatesJson());
    adapter.queueTextResponse(buildJudgeJson());

    const response = await request(server())
      .post(ANALYZE_PATH)
      .field('consent', 'true')
      .attach('image', buildJpegBuffer(), { filename: 'photo.jpg', contentType: 'image/jpeg' })
      .expect(201);

    const parsed = FinalGameResultSchema.safeParse(response.body);
    expect(parsed.success).toBe(true);
    expect((response.body as { disclaimer: string }).disclaimer).toBe(RESULT_DISCLAIMER);
    expect(adapter.imageCalls).toHaveLength(1);
    expect(adapter.textCalls).toHaveLength(2);
  });

  it('rejects a request without consent', async () => {
    const response = await request(server())
      .post(ANALYZE_PATH)
      .attach('image', buildJpegBuffer(), { filename: 'photo.jpg', contentType: 'image/jpeg' })
      .expect(400);

    expect((response.body as { errorCode: string }).errorCode).toBe('CONSENT_REQUIRED');
    expect(adapter.imageCalls).toHaveLength(0);
  });

  it('rejects a request without a file', async () => {
    const response = await request(server())
      .post(ANALYZE_PATH)
      .field('consent', 'true')
      .expect(400);

    expect((response.body as { errorCode: string }).errorCode).toBe('FILE_MISSING');
  });

  it('rejects a disallowed file type', async () => {
    const response = await request(server())
      .post(ANALYZE_PATH)
      .field('consent', 'true')
      .attach('image', Buffer.from('GIF89a-not-really'), {
        filename: 'photo.gif',
        contentType: 'image/gif',
      })
      .expect(415);

    expect((response.body as { errorCode: string }).errorCode).toBe('FILE_TYPE_NOT_ALLOWED');
  });

  it('rejects a renamed file whose bytes do not match the declared type', async () => {
    const response = await request(server())
      .post(ANALYZE_PATH)
      .field('consent', 'true')
      .attach('image', buildPngBuffer(), { filename: 'photo.jpg', contentType: 'image/jpeg' })
      .expect(422);

    expect((response.body as { errorCode: string }).errorCode).toBe('FILE_INVALID');
  });

  it('rejects a second file on the upload field', async () => {
    const response = await request(server())
      .post(ANALYZE_PATH)
      .field('consent', 'true')
      .attach('image', buildJpegBuffer(), { filename: 'a.jpg', contentType: 'image/jpeg' })
      .attach('image', buildJpegBuffer(), { filename: 'b.jpg', contentType: 'image/jpeg' })
      .expect(400);

    expect((response.body as { errorCode: string }).errorCode).toBe(
      'MULTIPLE_FILES_NOT_ALLOWED',
    );
  });

  it('returns a safe error envelope when the provider fails', async () => {
    adapter.queueImageResponse(new Error('raw provider stack trace with apiKey=abc123'));

    const response = await request(server())
      .post(ANALYZE_PATH)
      .field('consent', 'true')
      .attach('image', buildJpegBuffer(), { filename: 'photo.jpg', contentType: 'image/jpeg' })
      .expect(500);

    const bodyText = JSON.stringify(response.body);
    expect(bodyText).not.toContain('apiKey');
    expect(bodyText).not.toContain('stack');
  });
});
