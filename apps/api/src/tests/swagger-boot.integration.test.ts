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

/**
 * Regression guard: enabling Swagger mounts the OpenAPI UI, whose static-asset
 * serving requires `@fastify/static`. That dependency is only reached at boot,
 * so the mocked-route integration tests never touched it — which let it be
 * wrongly dropped once. Booting WITH swagger here fails fast if it goes missing
 * again.
 */
describe('Swagger UI boot (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_PROVIDER_ADAPTER)
      .useValue(new FakeAiAdapter())
      .overrideProvider(ClamAvAdapter)
      .useValue(buildCleanClamAvStub())
      .compile();

    app = await createTestApp(moduleRef, { withSwagger: true });
  });

  afterAll(async () => {
    await app.close();
  });

  const server = (): Server => app.getHttpServer();

  it('serves the Swagger UI page (requires @fastify/static)', async () => {
    const response = await request(server()).get('/docs');
    // Missing @fastify/static => the UI cannot be served (5xx). Present => the
    // UI HTML (200) or a redirect to the trailing-slash path.
    expect([200, 301, 302]).toContain(response.status);
  });

  it('serves the OpenAPI JSON document', async () => {
    const response = await request(server()).get('/docs-json');

    expect(response.status).toBe(200);
    expect((response.body as { openapi?: string }).openapi).toEqual(expect.any(String));
  });
});
