import type { INestApplication } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import { configureLifecycle } from './configure-lifecycle';
import { configureSecurity } from './configure-security';
import { configureValidation } from './configure-validation';
import { createFastifyAdapter } from './fastify-adapter';

/**
 * Boots a fully-wired Fastify application from a compiled testing module using
 * the same security, validation, and lifecycle configuration as production.
 * Integration tests call this instead of importing the HTTP platform vendor
 * directly, keeping `@nestjs/platform-fastify` owned solely by `bootstrap/`.
 */
export const createTestApp = async (moduleRef: TestingModule): Promise<INestApplication> => {
  const app = moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter());

  await configureSecurity(app);
  await configureValidation(app);
  configureLifecycle(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
};
