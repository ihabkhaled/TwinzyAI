import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppModule } from '../app.module';
import { createTestApp } from '../bootstrap/create-test-app';
import { AI_PROVIDER_ADAPTER } from '../modules/ai';
import { ClamAvAdapter } from '../modules/file-security/adapters/clamav.adapter';
import { PublicFigureEnrichmentService } from '../modules/public-figures';

import { FakeAiAdapter } from './fixtures/fake-ai-adapter';
import { buildCleanClamAvStub } from './fixtures/stubs';

describe('public figure details endpoint (integration)', () => {
  let app: INestApplication;
  const enrich = vi.fn().mockResolvedValue({
    entityId: 'Q170515',
    canonicalName: 'Omar Sharif',
    occupations: ['actor'],
    googleSearchUrl: 'https://www.google.com/search?q=Omar+Sharif',
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_PROVIDER_ADAPTER)
      .useValue(new FakeAiAdapter())
      .overrideProvider(ClamAvAdapter)
      .useValue(buildCleanClamAvStub())
      .overrideProvider(PublicFigureEnrichmentService)
      .useValue({ enrich })
      .compile();
    app = await createTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = (): Server => app.getHttpServer();

  it('returns validated post-match metadata without provider or model details', async () => {
    const response = await request(server())
      .get('/api/v1/public-figures/Q170515?languageCode=en')
      .expect(200);

    expect(response.body).toMatchObject({
      entityId: 'Q170515',
      canonicalName: 'Omar Sharif',
    });
    expect(enrich).toHaveBeenCalledWith('Q170515', 'en');
    expect(JSON.stringify(response.body)).not.toMatch(/provider|model/iu);
  });

  it.each([
    ['/api/v1/public-figures/not-an-entity?languageCode=en', 400],
    ['/api/v1/public-figures/Q170515', 400],
    ['/api/v1/public-figures/Q170515?languageCode=unsupported', 400],
  ])('rejects invalid request %s', async (path, status) => {
    const response = await request(server()).get(path);
    expect(response.status).toBe(status);
  });
});
