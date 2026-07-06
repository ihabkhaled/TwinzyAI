import type { ZodError } from 'zod';

import {
  VALIDATION_FAILED_MESSAGE,
  VALIDATION_FAILED_MESSAGE_KEY,
} from '../errors/error.constants';
import { ValidationError } from '../errors/validation.error';
import type { AppLoggerPort } from '../logger/logger.port';

import { VALIDATION_LOG_MESSAGE } from './validation.constants';
import { flattenZodIssues } from './zod-issue.mapper';

/**
 * Converts a zod failure into the typed ValidationError the exception filter
 * maps to a sanitized 400, logging the flattened issues first so every
 * rejected DTO is visible in the logs.
 */
export const createValidationException = (
  logger: AppLoggerPort,
  error: ZodError,
): ValidationError => {
  logger.warn(VALIDATION_LOG_MESSAGE, { issues: flattenZodIssues(error) });
  return new ValidationError(VALIDATION_FAILED_MESSAGE, VALIDATION_FAILED_MESSAGE_KEY);
};
