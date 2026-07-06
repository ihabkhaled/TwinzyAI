import type { INestApplication } from '@nestjs/common';

import { AppLogger } from '../core/logger/app-logger.service';
import { VALIDATION_LOG_CONTEXT } from '../core/validation/validation.constants';

import { VALIDATION_CONFIGURED_MESSAGE } from './configure-validation.constants';

/**
 * Wires the validation plumbing. Request validation is zod-only: routes
 * attach schema-bound pipes built with createZodValidationPipe (there is no
 * app-wide schema, so no global pipe is installed). The logger is resolved
 * here — AppLogger is transient-scoped, so it must be resolved, not `get`.
 */
export const configureValidation = async (app: INestApplication): Promise<void> => {
  const logger = await app.resolve(AppLogger);
  logger.setContext(VALIDATION_LOG_CONTEXT);
  logger.debug(VALIDATION_CONFIGURED_MESSAGE);
};
