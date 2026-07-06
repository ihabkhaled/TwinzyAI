import type { PipeTransform, Type } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { ZodType } from 'zod';

import { AppLogger } from '../logger/app-logger.service';

import { VALIDATION_LOG_CONTEXT } from './validation.constants';
import { createValidationException } from './validation-exception.factory';

/**
 * Builds a route-scoped zod validation pipe class for @UsePipes: parses the
 * incoming value with the given schema, logs flattened issues, and throws
 * the typed ValidationError on failure. Returned as a class so Nest DI
 * injects the logger.
 */
export const createZodValidationPipe = (schema: ZodType): Type<PipeTransform> => {
  @Injectable()
  class ZodValidationPipe implements PipeTransform {
    public constructor(private readonly logger: AppLogger) {
      this.logger.setContext(VALIDATION_LOG_CONTEXT);
    }

    public transform(value: unknown): unknown {
      const result = schema.safeParse(value);
      if (!result.success) {
        throw createValidationException(this.logger, result.error);
      }
      return result.data;
    }
  }

  return ZodValidationPipe;
};
