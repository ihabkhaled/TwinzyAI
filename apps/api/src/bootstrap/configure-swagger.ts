import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import {
  SWAGGER_DESCRIPTION,
  SWAGGER_PATH,
  SWAGGER_TITLE,
  SWAGGER_VERSION,
} from './bootstrap.constants';

/**
 * Mounts the OpenAPI document + UI. Guarded by the swaggerEnabled config
 * flag in the bootstrap orchestrator so it is off in production by default.
 * No auth scheme: the game is anonymous and free.
 */
export const configureSwagger = (app: INestApplication): void => {
  const documentConfig = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion(SWAGGER_VERSION)
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup(SWAGGER_PATH, app, document);
};
