import { DEFAULT_RESULT_COUNT } from '@twinzy/shared';

import { AnalyzeRequestBodySchema } from '../api/dto/analyze-request.dto';

/**
 * Resolve the analyze request's desired result count: parse the multipart
 * body leniently and coerce whatever arrived to a supported integer between
 * MIN_RESULT_COUNT and MAX_RESULT_COUNT, defaulting to DEFAULT_RESULT_COUNT.
 */
export const resolveRequestResultCount = (body: unknown): number => {
  const parsed = AnalyzeRequestBodySchema.safeParse(body);
  return parsed.success ? parsed.data.resultCount : DEFAULT_RESULT_COUNT;
};
