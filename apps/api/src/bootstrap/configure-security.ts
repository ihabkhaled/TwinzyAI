import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppConfigService } from '../config/app-config.service';
import { UPLOAD_HARD_CAP_BYTES, UPLOAD_MAX_FILES } from '../modules/game/model/game.constants';

import { CORS_ALLOWED_METHODS, CORS_MAX_AGE_SECONDS } from './bootstrap.constants';

/**
 * Registers the security-relevant Fastify plugins (Helmet response headers,
 * cookie parsing, bounded in-memory multipart) and configures CORS from
 * typed config. When no origins are configured, CORS is closed by default.
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

  app.enableCors({
    origin: corsAllowedOrigins.length > 0 ? [...corsAllowedOrigins] : false,
    methods: [...CORS_ALLOWED_METHODS],
    maxAge: CORS_MAX_AGE_SECONDS,
  });
};
