import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import type { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import type { RouteOptions } from 'fastify';

import { AppConfigService } from '../config/app-config.service';
import { UPLOAD_HARD_CAP_BYTES, UPLOAD_MAX_FILES } from '../modules/game/model/game.constants';

import { CORS_ALLOWED_METHODS, CORS_MAX_AGE_SECONDS } from './bootstrap.constants';
import { jsonRouteBodyLimitFor } from './json-route-body-limit.util';

/**
 * Registers the security-relevant Fastify plugins (Helmet response headers,
 * cookie parsing, bounded in-memory multipart), applies the tighter per-route
 * JSON body caps, and configures CORS from typed config. When no origins are
 * configured, CORS is closed by default.
 */
export const configureSecurity = async (app: NestFastifyApplication): Promise<void> => {
  const { corsAllowedOrigins } = app.get(AppConfigService);

  await app.register(helmet);
  await app.register(cookie);
  await app.register(multipart, {
    attachFieldsToBody: false,
    limits: {
      fileSize: UPLOAD_HARD_CAP_BYTES,
      files: UPLOAD_MAX_FILES,
    },
  });

  applyJsonRouteBodyLimits(app);

  app.enableCors({
    origin: corsAllowedOrigins.length > 0 ? [...corsAllowedOrigins] : false,
    methods: [...CORS_ALLOWED_METHODS],
    maxAge: CORS_MAX_AGE_SECONDS,
  });
};

/**
 * Shrinks the request-body cap for the small JSON routes to their per-route
 * limit as Fastify registers each one. Runs before Nest mounts the controller
 * routes (bootstrap applies security before `listen`/`init`), so every matching
 * route is capped natively; non-matching routes keep the global multipart limit.
 */
const applyJsonRouteBodyLimits = (app: NestFastifyApplication): void => {
  const instance = (app.getHttpAdapter() as FastifyAdapter).getInstance();
  instance.addHook('onRoute', (routeOptions: RouteOptions): void => {
    const limitBytes = jsonRouteBodyLimitFor(routeOptions.url);
    if (limitBytes !== undefined) {
      routeOptions.bodyLimit = limitBytes;
    }
  });
};
