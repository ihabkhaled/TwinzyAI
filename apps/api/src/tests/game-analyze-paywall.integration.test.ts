import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  ErrorCode,
  FinalGameResultSchema,
  GAME_ANALYZE_PATH,
  GAME_ANALYZE_STREAM_PATH,
  GameStreamEvent,
  GameStreamMessageSchema,
  PAYMENTS_ORDERS_PATH,
} from '@twinzy/shared';

import { AppModule } from '../app.module';
import { createTestApp } from '../bootstrap/create-test-app';
import { AI_PROVIDER_ADAPTER } from '../modules/ai';
import { ClamAvAdapter } from '../modules/file-security/adapters/clamav.adapter';
import { PaypalAdapter } from '../modules/payments/adapters/paypal.adapter';

import {
  buildCandidatesJson,
  buildJudgeJson,
  buildTraitExtractionJson,
  FakeAiAdapter,
} from './fixtures/fake-ai-adapter';
import { buildJpegBuffer } from './fixtures/image-fixtures';
import { buildCleanClamAvStub } from './fixtures/stubs';

// The config module reads env when it is imported (before beforeAll), and the
// vitest api-integration project pins the paywall OFF by default. Enable it for
// THIS suite ahead of those imports. vi.hoisted runs before the hoisted imports
// above; vi.stubEnv (restored by vi.unstubAllEnvs) is not a direct env write.
vi.hoisted(() => {
  vi.stubEnv('PAYPAL_CLIENT_ID', 'integration-client');
  vi.stubEnv('PAYPAL_CLIENT_SECRET', 'integration-secret');
});

const ORDER_ID = '5O190127TN364715T';
const CAPTURE = { orderId: ORDER_ID, captureId: 'CAP-INTEGRATION-1' };

/**
 * Full-stack paywall-ON coverage: PAYPAL_* env is set BEFORE the module
 * compiles (the zod env schema reads it at boot), and only the outer PayPal
 * HTTP adapter is faked — controller, gate, use-cases, file security, and the
 * refund-on-failure path all run for real.
 */
describe('POST /api/v1/game/analyze with the paywall enabled (integration)', () => {
  let app: INestApplication;
  let adapter: FakeAiAdapter;
  const captureOrder = vi.fn(() => Promise.resolve(CAPTURE));
  const verifyApprovedOrder = vi.fn((orderId: string, expectedRequestId?: string) =>
    Promise.resolve({ gateway: 'paypal', orderId, expectedRequestId }),
  );
  const refundCapture = vi.fn(() => Promise.resolve());
  const createOrder = vi.fn(() => Promise.resolve(ORDER_ID));

  beforeAll(async () => {
    adapter = new FakeAiAdapter();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_PROVIDER_ADAPTER)
      .useValue(adapter)
      .overrideProvider(ClamAvAdapter)
      .useValue(buildCleanClamAvStub())
      .overrideProvider(PaypalAdapter)
      .useValue({ captureOrder, verifyApprovedOrder, refundCapture, createOrder })
      .compile();

    app = await createTestApp(moduleRef);
  });

  afterEach(() => {
    adapter.imageCalls.length = 0;
    adapter.textCalls.length = 0;
    adapter.textSteps.length = 0;
    captureOrder.mockClear();
    verifyApprovedOrder.mockClear();
    refundCapture.mockClear();
    createOrder.mockClear();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await app.close();
  });

  const server = (): Server => app.getHttpServer() as Server;

  const postAnalyze = (fields: Record<string, string>): request.Test => {
    let req = request(server()).post(GAME_ANALYZE_PATH);
    for (const [key, value] of Object.entries(fields)) {
      req = req.field(key, value);
    }
    return req.attach('image', buildJpegBuffer(), {
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
    });
  };

  const postStream = (fields: Record<string, string>): request.Test => {
    let req = request(server()).post(GAME_ANALYZE_STREAM_PATH);
    for (const [key, value] of Object.entries(fields)) {
      req = req.field(key, value);
    }
    return req.attach('image', buildJpegBuffer(), {
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
    });
  };

  it('creates a server-priced order for a request id', async () => {
    const response = await request(server())
      .post(PAYMENTS_ORDERS_PATH)
      .send({ requestId: '3b241101-e2bb-4255-8caf-4136c566a962' })
      .expect(201);

    expect(response.body).toStrictEqual({ orderId: ORDER_ID });
    expect(createOrder).toHaveBeenCalledWith('3b241101-e2bb-4255-8caf-4136c566a962');
  });

  it('refuses to run an unpaid analysis with 402 PAYMENT_REQUIRED (no AI call)', async () => {
    const response = await postAnalyze({ consent: 'true' }).expect(402);

    expect(response.body).toMatchObject({ errorCode: ErrorCode.PaymentRequired });
    expect(verifyApprovedOrder).not.toHaveBeenCalled();
    expect(captureOrder).not.toHaveBeenCalled();
    expect(adapter.imageCalls).toHaveLength(0);
  });

  it('rejects a malformed order id without contacting the provider', async () => {
    const response = await postAnalyze({
      consent: 'true',
      paypalOrderId: '../not-an-order',
    }).expect(402);

    expect(response.body).toMatchObject({ errorCode: ErrorCode.PaymentOrderInvalid });
    expect(verifyApprovedOrder).not.toHaveBeenCalled();
    expect(captureOrder).not.toHaveBeenCalled();
    expect(adapter.imageCalls).toHaveLength(0);
  });

  it('captures exactly once and serves the analysis for a paid request', async () => {
    adapter.queueImageResponse(buildTraitExtractionJson());
    adapter.queueTextResponse(buildCandidatesJson());
    adapter.queueTextResponse(buildJudgeJson());

    const response = await postAnalyze({ consent: 'true', paypalOrderId: ORDER_ID }).expect(201);

    expect(captureOrder).toHaveBeenCalledTimes(1);
    expect(captureOrder).toHaveBeenCalledWith(ORDER_ID, undefined);
    expect(verifyApprovedOrder).toHaveBeenCalledWith(ORDER_ID, undefined);
    expect(refundCapture).not.toHaveBeenCalled();
    expect(FinalGameResultSchema.safeParse(response.body).success).toBe(true);
  });

  it('does not capture when the non-stream pipeline fails before a result exists', async () => {
    adapter.queueImageResponse(new Error('extraction exploded'));

    await postAnalyze({ consent: 'true', paypalOrderId: ORDER_ID }).expect(500);

    expect(verifyApprovedOrder).toHaveBeenCalledTimes(1);
    expect(captureOrder).not.toHaveBeenCalled();
    expect(refundCapture).not.toHaveBeenCalled();
  });

  it('does not capture when paid streaming trait extraction fails', async () => {
    adapter.queueImageResponse(new Error('extraction exploded'));

    const response = await postStream({
      consent: 'true',
      paypalOrderId: ORDER_ID,
      requestId: '3b241101-e2bb-4255-8caf-4136c566a962',
    }).expect(200);

    const messages = response.text
      .split('\n\n')
      .map((frame) => frame.split('\n').find((line) => line.startsWith('data:')))
      .filter((line): line is string => line !== undefined)
      .map((line) => GameStreamMessageSchema.parse(JSON.parse(line.slice('data:'.length).trim())));
    expect(messages.at(-1)?.event).toBe(GameStreamEvent.Error);
    expect(verifyApprovedOrder).toHaveBeenCalledTimes(1);
    expect(captureOrder).not.toHaveBeenCalled();
    expect(refundCapture).not.toHaveBeenCalled();
  });

  it('never captures for a request that fails consent (payment untouched)', async () => {
    await postAnalyze({ paypalOrderId: ORDER_ID }).expect(400);

    expect(captureOrder).not.toHaveBeenCalled();
    expect(refundCapture).not.toHaveBeenCalled();
  });
});
