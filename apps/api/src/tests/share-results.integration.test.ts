import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { FinalGameResultSchema, SHARE_RESULTS_PATH } from '@twinzy/shared';

import { AppModule } from '../app.module';
import { createTestApp } from '../bootstrap/create-test-app';
import { AppConfigService } from '../config';
import { AI_PROVIDER_ADAPTER } from '../modules/ai';
import { ClamAvAdapter } from '../modules/file-security/adapters/clamav.adapter';

import { buildFinalGameResultPayload, FakeAiAdapter } from './fixtures/fake-ai-adapter';
import { buildCleanClamAvStub } from './fixtures/stubs';

/** Boots a fresh app (isolated cache + throttler) with the mocked adapters. */
const bootApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AI_PROVIDER_ADAPTER)
    .useValue(new FakeAiAdapter())
    .overrideProvider(ClamAvAdapter)
    .useValue(buildCleanClamAvStub())
    .compile();
  return createTestApp(moduleRef);
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

describe('share-results endpoints (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = (): Server => app.getHttpServer();

  const createShare = (): request.Test =>
    request(server()).post(SHARE_RESULTS_PATH).send({ result: buildFinalGameResultPayload() });

  it('creates a temporary share and returns a UUID + expiry metadata', async () => {
    const response = await createShare().expect(201);

    expect(response.body.shareId).toMatch(UUID_PATTERN);
    expect(response.body.shareUrl).toContain(`/share/${response.body.shareId}`);
    expect(response.body.ttlSeconds).toBe(600);
    const window = Date.parse(response.body.expiresAt) - Date.parse(response.body.createdAt);
    expect(window).toBe(600_000);
  });

  it('reads back an active share with the same result and a live countdown', async () => {
    const { body: created } = await createShare().expect(201);

    const response = await request(server())
      .get(`${SHARE_RESULTS_PATH}/${created.shareId}`)
      .expect(200);

    const expected = FinalGameResultSchema.parse(buildFinalGameResultPayload());
    expect(response.body.shareId).toBe(created.shareId);
    expect(response.body.languageCode).toBe('en');
    expect(response.body.result.results[0].name).toBe(expected.results[0]?.name);
    expect(response.body.remainingSeconds).toBeGreaterThan(0);
    expect(response.body.remainingSeconds).toBeLessThanOrEqual(600);
    // No image BYTES in the shared payload (trait field names like imageQuality
    // are expected; actual image data / base64 must never appear).
    expect(JSON.stringify(response.body)).not.toMatch(/data:image|;base64,/iu);
  });

  it('returns a safe 404 (messageKey) for an unknown share id', async () => {
    const response = await request(server())
      .get(`${SHARE_RESULTS_PATH}/3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b`)
      .expect(404);

    expect(response.body.messageKey).toBe('errors.share.notFound');
    expect(response.body.errorCode).toBe('SHARE_NOT_FOUND');
  });

  it('rejects a non-UUID share id with a 400 validation error', async () => {
    const response = await request(server()).get(`${SHARE_RESULTS_PATH}/not-a-uuid`);
    expect(response.status).toBe(400);
  });

  it('rejects unknown top-level keys (no image/file slot by construction)', async () => {
    const response = await request(server())
      .post(SHARE_RESULTS_PATH)
      .send({ result: buildFinalGameResultPayload(), image: 'data:image/png;base64,AAAA' });
    expect(response.status).toBe(400);
  });

  it('rejects a result carrying an embedded data: image URL as unsafe', async () => {
    const response = await request(server())
      .post(SHARE_RESULTS_PATH)
      .send({
        result: buildFinalGameResultPayload({
          fallbackMessage: 'here is a photo data:image/png;base64,AAAABBBBCCCC',
        }),
      })
      .expect(400);

    expect(response.body.errorCode).toBe('SHARE_RESULT_UNSAFE');
  });

  it('rejects a result carrying forbidden wording as unsafe', async () => {
    const response = await request(server())
      .post(SHARE_RESULTS_PATH)
      .send({
        result: buildFinalGameResultPayload({ fallbackMessage: 'we identified the person is you' }),
      })
      .expect(400);

    expect(response.body.errorCode).toBe('SHARE_RESULT_UNSAFE');
  });

  it('deletes a share, after which reads return 404', async () => {
    const { body: created } = await createShare().expect(201);

    const deleted = await request(server()).delete(`${SHARE_RESULTS_PATH}/${created.shareId}`);
    expect(deleted.status).toBe(204);
    const afterDelete = await request(server()).get(`${SHARE_RESULTS_PATH}/${created.shareId}`);
    expect(afterDelete.status).toBe(404);
  });
});

/**
 * Each bounded-limit behavior gets its own app because the ~12 KB fixture makes
 * the payload/active/rate caps mutually exclusive in a single config. Config
 * limits are overridden by spying the AppConfigService getter (boot-independent
 * and deterministic, unlike env precedence through ConfigModule).
 */
describe('share-results payload cap (integration)', () => {
  let app: INestApplication;
  const spy = vi.spyOn(AppConfigService.prototype, 'shareResultMaxPayloadBytes', 'get');

  beforeAll(async () => {
    spy.mockReturnValue(2000);
    app = await bootApp();
  });

  afterAll(async () => {
    spy.mockRestore();
    await app.close();
  });

  it('rejects an over-budget result with a 413 share-payload-too-large error', async () => {
    const response = await request(app.getHttpServer())
      .post(SHARE_RESULTS_PATH)
      .send({ result: buildFinalGameResultPayload() })
      .expect(413);

    expect(response.body.errorCode).toBe('SHARE_PAYLOAD_TOO_LARGE');
  });
});

describe('share-results active-items cap (integration)', () => {
  let app: INestApplication;
  const spy = vi.spyOn(AppConfigService.prototype, 'shareResultMaxActiveItems', 'get');

  beforeAll(async () => {
    spy.mockReturnValue(1);
    app = await bootApp();
  });

  afterAll(async () => {
    spy.mockRestore();
    await app.close();
  });

  it('rejects a new share once the bounded cache is at capacity', async () => {
    await request(app.getHttpServer())
      .post(SHARE_RESULTS_PATH)
      .send({ result: buildFinalGameResultPayload() })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post(SHARE_RESULTS_PATH)
      .send({ result: buildFinalGameResultPayload() })
      .expect(429);

    expect(response.body.errorCode).toBe('SHARE_CAPACITY_REACHED');
  });
});

describe('share-results honors configured TTL + rate limit (integration)', () => {
  let app: INestApplication;
  const spy = vi.spyOn(AppConfigService.prototype, 'shareResultTtlSeconds', 'get');

  beforeAll(async () => {
    spy.mockReturnValue(120);
    app = await bootApp();
  });

  afterAll(async () => {
    spy.mockRestore();
    await app.close();
  });

  it('applies a non-default TTL to the created share', async () => {
    const response = await request(app.getHttpServer())
      .post(SHARE_RESULTS_PATH)
      .send({ result: buildFinalGameResultPayload() })
      .expect(201);

    expect(response.body.ttlSeconds).toBe(120);
    const window = Date.parse(response.body.expiresAt) - Date.parse(response.body.createdAt);
    expect(window).toBe(120_000);
  });

  it('rate-limits create beyond the per-client window (429)', async () => {
    // One create already ran above; the create limit is 20/min per client, so
    // probing the rest of the window plus one more must trip a 429. Recursion
    // (not a loop) keeps the sequential probing free of an await-in-loop, and
    // the assertion stays outside the recursion (no conditional expect).
    const probe = async (attemptsLeft: number): Promise<request.Response | undefined> => {
      if (attemptsLeft === 0) {
        return undefined;
      }
      const response = await request(app.getHttpServer())
        .post(SHARE_RESULTS_PATH)
        .send({ result: buildFinalGameResultPayload() });
      return response.status === 429 ? response : probe(attemptsLeft - 1);
    };

    const limited = await probe(21);
    expect(limited?.status).toBe(429);
    expect(limited?.body.errorCode).toBe('RATE_LIMITED');
  });
});
