import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module';
import { createTestApp } from '../bootstrap/create-test-app';
import { AI_PROVIDER_ADAPTER } from '../modules/ai';
import { ClamAvAdapter } from '../modules/file-security/adapters/clamav.adapter';

import { FakeAiAdapter } from './fixtures/fake-ai-adapter';
import { buildCleanClamAvStub } from './fixtures/stubs';

const CANCEL_PATH = '/api/v1/game/cancel';
const A_UUID = '11111111-1111-4111-8111-111111111111';

describe('POST /api/v1/game/cancel body cap (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_PROVIDER_ADAPTER)
      .useValue(new FakeAiAdapter())
      .overrideProvider(ClamAvAdapter)
      .useValue(buildCleanClamAvStub())
      .compile();

    app = await createTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = (): Server => app.getHttpServer();

  it('rejects an oversized cancel body with 413 before it is ever parsed', async () => {
    // A body well past the 8 KiB per-route cap but far below the ~11 MiB global
    // multipart limit — only the tighter per-route cap can reject it.
    const oversized = { tabId: A_UUID, requestId: A_UUID, streamId: A_UUID, pad: 'x'.repeat(9000) };

    const response = await request(server()).post(CANCEL_PATH).send(oversized);

    expect(response.status).toBe(413);
  });

  it('still accepts a normal (well-formed, tiny) cancel body', async () => {
    const response = await request(server())
      .post(CANCEL_PATH)
      .send({ tabId: A_UUID, requestId: A_UUID, streamId: A_UUID });

    // No in-flight stream matches these ids, so the cancel is a silent no-op —
    // the point here is that a normal-sized body is NOT blocked by the cap.
    expect(response.status).toBe(201);
    expect((response.body as { cancelled: boolean }).cancelled).toBe(false);
  });
});
