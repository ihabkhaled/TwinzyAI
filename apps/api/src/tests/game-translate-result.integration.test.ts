import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { GAME_PROMPT_VERSION, RESULT_DISCLAIMER_BY_LANGUAGE } from '@twinzy/shared';

import { AppModule } from '../app.module';
import { createTestApp } from '../bootstrap/create-test-app';
import { AI_PROVIDER_ADAPTER } from '../modules/ai';
import { ClamAvAdapter } from '../modules/file-security/adapters/clamav.adapter';

import { buildFinalGameResultPayload, FakeAiAdapter } from './fixtures/fake-ai-adapter';
import { buildCleanClamAvStub } from './fixtures/stubs';

const TRANSLATE_PATH = '/api/v1/game/translate-result';

/** A faithful Arabic-side translation the fake model returns. */
const buildTranslatedPayload = (): Record<string, unknown> =>
  buildFinalGameResultPayload({
    languageCode: 'ar',
    compactTraitSummary: ['وجه بيضاوي واضح', 'شعر داكن متموج'],
  });

describe('POST /api/v1/game/translate-result (integration)', () => {
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

  it('translates an existing result without ever touching the image pipeline', async () => {
    adapter.queueTextResponse(JSON.stringify(buildTranslatedPayload()));

    const response = await request(server())
      .post(TRANSLATE_PATH)
      .send({ targetLanguageCode: 'ar', result: buildFinalGameResultPayload() })
      .expect(201);

    // Text-only guarantee: zero image-capable adapter calls, one text call.
    expect(adapter.imageCalls).toHaveLength(0);
    expect(adapter.textCalls).toHaveLength(1);
    expect(response.body).toMatchObject({ languageCode: 'ar' });
  });

  it('preserves names, scores, ranks, and verdicts even if the model changed them', async () => {
    const tampered = buildTranslatedPayload();
    const results = tampered['results'] as Record<string, unknown>[];
    if (results[0] !== undefined) {
      // Model illegally re-scores and re-ranks — the server must undo it.
      results[0]['finalStyleVibeFitScore'] = 11;
      results[0]['verdict'] = 'weak';
      results[0]['confidenceLevel'] = 'low';
    }
    adapter.queueTextResponse(JSON.stringify(tampered));

    const original = buildFinalGameResultPayload();
    const response = await request(server())
      .post(TRANSLATE_PATH)
      .send({ targetLanguageCode: 'ar', result: original })
      .expect(201);

    const originalItem = (original['results'] as Record<string, unknown>[])[0];
    const translatedItem = (response.body as { results: Record<string, unknown>[] }).results[0];
    expect(translatedItem?.['name']).toBe(originalItem?.['name']);
    expect(translatedItem?.['rank']).toBe(originalItem?.['rank']);
    expect(translatedItem?.['finalStyleVibeFitScore']).toBe(
      originalItem?.['finalStyleVibeFitScore'],
    );
    expect(translatedItem?.['verdict']).toBe(originalItem?.['verdict']);
    expect(translatedItem?.['confidenceLevel']).toBe(originalItem?.['confidenceLevel']);
    expect((response.body as { traitCount: number }).traitCount).toBe(original['traitCount']);
  });

  it('enforces the server-side localized disclaimer on the translated result', async () => {
    adapter.queueTextResponse(
      JSON.stringify({ ...buildTranslatedPayload(), disclaimer: 'model nonsense disclaimer' }),
    );

    const response = await request(server())
      .post(TRANSLATE_PATH)
      .send({ targetLanguageCode: 'ar', result: buildFinalGameResultPayload() })
      .expect(201);

    expect((response.body as { disclaimer: string }).disclaimer).toBe(
      RESULT_DISCLAIMER_BY_LANGUAGE.ar,
    );
  });

  it('rejects a translation that changes names (no new matching possible)', async () => {
    const renamed = buildTranslatedPayload();
    const results = renamed['results'] as Record<string, unknown>[];
    if (results[0] !== undefined) {
      results[0]['name'] = 'A Completely Different Person';
    }
    adapter.queueTextResponse(JSON.stringify(renamed));

    const response = await request(server())
      .post(TRANSLATE_PATH)
      .send({ targetLanguageCode: 'ar', result: buildFinalGameResultPayload() })
      .expect(502);

    expect((response.body as { errorCode: string }).errorCode).toBe('AI_RESPONSE_INVALID');
  });

  it('rejects an unsupported target language and unknown extra keys strictly', async () => {
    await request(server())
      .post(TRANSLATE_PATH)
      .send({ targetLanguageCode: 'xx', result: buildFinalGameResultPayload() })
      .expect(400);

    await request(server())
      .post(TRANSLATE_PATH)
      .send({
        targetLanguageCode: 'ar',
        result: buildFinalGameResultPayload(),
        image: 'base64-image-smuggle-attempt',
      })
      .expect(400);

    expect(adapter.textCalls).toHaveLength(0);
    expect(adapter.imageCalls).toHaveLength(0);
  });

  it('rejects a result payload that does not match the strict contract', async () => {
    const invalid = buildFinalGameResultPayload({ promptVersion: 'stale-version' });

    await request(server())
      .post(TRANSLATE_PATH)
      .send({ targetLanguageCode: 'ar', result: invalid })
      .expect(400);

    expect(adapter.textCalls).toHaveLength(0);
  });

  it('echoes the active prompt version on the translated payload', async () => {
    adapter.queueTextResponse(JSON.stringify(buildTranslatedPayload()));

    const response = await request(server())
      .post(TRANSLATE_PATH)
      .send({ targetLanguageCode: 'ar', result: buildFinalGameResultPayload() })
      .expect(201);

    expect((response.body as { promptVersion: string }).promptVersion).toBe(GAME_PROMPT_VERSION);
  });
});
