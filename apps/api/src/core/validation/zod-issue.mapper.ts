import type { ZodError } from 'zod';

import { ROOT_FIELD_NAME } from './validation.constants';
import type { ValidationIssue } from './validation.types';

const toFieldPath = (path: readonly PropertyKey[]): string =>
  path.length === 0 ? ROOT_FIELD_NAME : path.map(String).join('.');

/**
 * Flattens a zod error into field/constraint issues with dot-joined paths
 * (nested objects and array indices included) so rejected DTOs are loggable
 * without leaking submitted values.
 */
export const flattenZodIssues = (error: ZodError): ValidationIssue[] =>
  error.issues.map((issue) => ({
    field: toFieldPath(issue.path),
    constraint: issue.message,
  }));
