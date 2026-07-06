import type { INestApplication } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';

import { API_GLOBAL_PREFIX } from '@twinzy/shared';

import { DEFAULT_API_VERSION } from './bootstrap.constants';

/**
 * Applies routing + lifecycle concerns: the global /api prefix, URI
 * versioning (/v1), and graceful-shutdown hooks so OnModuleDestroy hooks run
 * on SIGTERM.
 */
export const configureLifecycle = (app: INestApplication): void => {
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: DEFAULT_API_VERSION });
  app.enableShutdownHooks();
};
