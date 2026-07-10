import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HEALTH_PATH, HealthResponseSchema } from '@twinzy/shared';

import { AppModule } from '../app.module';
import { createTestApp } from '../bootstrap/create-test-app';

describe('GET /api/v1/health (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = await createTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds 200 with a valid health payload', async () => {
    const server = app.getHttpServer();
    const response = await request(server).get(HEALTH_PATH).expect(200);

    expect(HealthResponseSchema.safeParse(response.body).success).toBe(true);
  });

  it('sends hardened security headers on the health response', async () => {
    const server = app.getHttpServer();
    const response = await request(server).get(HEALTH_PATH).expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('responds 404 for unknown routes without leaking internals', async () => {
    const server = app.getHttpServer();
    const response = await request(server).get('/api/v1/unknown').expect(404);

    expect(JSON.stringify(response.body)).not.toContain('stack');
    expect((response.body as { messageKey: string }).messageKey).toBeDefined();
  });
});
