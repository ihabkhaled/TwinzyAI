import { z } from 'zod';

import {
  DEFAULT_RESULT_COUNT,
  MAX_RESULT_COUNT,
  MIN_RESULT_COUNT,
} from '../constants/trait.constants';

/**
 * User-selected result count: 1 to 10, default 10. Used by both frontend
 * forms and backend DTOs so validation is the same on both sides.
 */
export const ResultCountSchema = z
  .number()
  .int()
  .min(MIN_RESULT_COUNT)
  .max(MAX_RESULT_COUNT)
  .default(DEFAULT_RESULT_COUNT);

export type ResultCount = z.infer<typeof ResultCountSchema>;
