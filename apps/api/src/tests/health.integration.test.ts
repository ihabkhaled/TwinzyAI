import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { API_GLOBAL_PREFIX, HealthResponseSchema } from '@twinzy/shared';

import { AppModule } from '../app.module';

describe('GET /api/v1/health (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(API_GLOBAL_PREFIX);
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds 200 with a valid health payload', async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server).get('/api/v1/health').expect(200);

    expect(HealthResponseSchema.safeParse(response.body).success).toBe(true);
  });

  it('responds 404 for unknown routes without leaking internals', async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server).get('/api/v1/unknown').expect(404);

    expect(JSON.stringify(response.body)).not.toContain('stack');
  });
});
