/**
 * Candidate/result bounds and score bands for the matching pipeline. The
 * advanced trait taxonomy itself lives in trait-category.constants.ts.
 */

/** User-facing result count: 1 to 10, default 10. */
export const MIN_RESULT_COUNT = 1;

export const MAX_RESULT_COUNT = 10;

export const DEFAULT_RESULT_COUNT = 10;

/** Dropdown options exposed by the frontend (MIN through MAX_RESULT_COUNT). */
export const RESULT_COUNT_OPTIONS: readonly number[] = Array.from(
  { length: MAX_RESULT_COUNT - MIN_RESULT_COUNT + 1 },
  (_unused, index) => MIN_RESULT_COUNT + index,
);

/** Internal candidate pool size used by Prompt 2. It is always >= N. */
export const MIN_CANDIDATE_POOL = 1;

export const MAX_CANDIDATE_POOL = 25;

export const MIN_SCORE = 0;

export const MAX_SCORE = 100;

/** Results below this score are not displayed unless explicitly debugging. */
export const MIN_DISPLAY_SCORE = 70;

/** Localized markers that mean a field was not actually observed. */
export const UNCLEAR_TRAIT_VALUE_MARKERS = [
  'unclear',
  'unknown',
  'not visible',
  'غير واضح',
  'غير ظاهرة',
  'غير ظاهر',
  'لا يمكن تحديد',
] as const;

export const IMAGE_QUALITY_LEVELS = ['clear', 'moderate', 'low', 'very-low'] as const;

/**
 * Score calibration (verdict bands, uncertainty/low-trait caps, minimum
 * strong-trait evidence) is owned by the judge prompt:
 * apps/api/src/modules/ai/prompts/use-3rd-prompt.md. It is deliberately NOT
 * mirrored as constants here — an unconsumed copy drifted from the shipped
 * prompt once and misled readers, so the prompt is the single owner.
 */
