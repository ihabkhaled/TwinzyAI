import type { INestApplication } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import { configureLifecycle } from './configure-lifecycle';
import { configureSecurity } from './configure-security';
import { configureSwagger } from './configure-swagger';
import { configureValidation } from './configure-validation';
import type { CreateTestAppOptions } from './create-test-app.types';
import { createFastifyAdapter } from './fastify-adapter';

/**
 * Boots a fully-wired Fastify application from a compiled testing module using
 * the same security, validation, and lifecycle configuration as production.
 * Integration tests call this instead of importing the HTTP platform vendor
 * directly, keeping `@nestjs/platform-fastify` owned solely by `bootstrap/`.
 *
 * Pass `{ withSwagger: true }` to also mount the OpenAPI UI (as production does
 * when the flag is on) — this exercises the Swagger UI's `@fastify/static`
 * dependency, which is only reached at boot, never by the mocked API routes.
 */
export const createTestApp = async (
  moduleRef: TestingModule,
  options?: CreateTestAppOptions,
): Promise<INestApplication> => {
  const app = moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter());

  await configureSecurity(app);
  await configureValidation(app);
  configureLifecycle(app);
  if (options?.withSwagger === true) {
    configureSwagger(app);
  }
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
};
