import { NestFactory } from '@nestjs/core';

import { bootstrap } from './bootstrap/bootstrap';

import 'reflect-metadata';

/**
 * Vercel statically detects NestJS only when the entrypoint imports
 * `@nestjs/core` directly. The actual application startup remains delegated to
 * the canonical bootstrap used by local and Railway deployments.
 */
if (typeof NestFactory.create !== 'function') {
  throw new TypeError('NestJS application factory is unavailable');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`Fatal bootstrap error: ${message}\n`);
  process.exitCode = 1;
});
