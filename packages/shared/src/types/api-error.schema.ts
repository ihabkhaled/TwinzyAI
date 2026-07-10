/**
 * The safe error envelope every API error response uses. Never contains
 * provider errors, stack traces, or file contents. The frontend can validate
 * the server response against this schema.
 */
import { z } from 'zod';

import {
  MAX_ERROR_CODE_LENGTH,
  MAX_ERROR_MESSAGE_KEY_LENGTH,
  MAX_ERROR_MESSAGE_LENGTH,
  MAX_HTTP_STATUS_CODE,
  MIN_HTTP_STATUS_CODE,
} from '../constants/response-bounds.constants';

export const ApiErrorResponseSchema = z.strictObject({
  statusCode: z.number().int().min(MIN_HTTP_STATUS_CODE).max(MAX_HTTP_STATUS_CODE),
  errorCode: z.string().trim().min(1).max(MAX_ERROR_CODE_LENGTH),
  message: z.string().trim().min(1).max(MAX_ERROR_MESSAGE_LENGTH),
  messageKey: z.string().trim().startsWith('errors.').max(MAX_ERROR_MESSAGE_KEY_LENGTH),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
