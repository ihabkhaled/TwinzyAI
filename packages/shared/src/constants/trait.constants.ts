/**
 * Candidate/result bounds and score bands for the matching pipeline. The
 * advanced trait taxonomy itself lives in trait-category.constants.ts.
 */

/** User-facing result count: 1 to 10, default 10. */
export const MIN_RESULT_COUNT = 1;

export const MAX_RESULT_COUNT = 10;

export const DEFAULT_RESULT_COUNT = 10;

/** Dropdown options exposed by the frontend (1 through MAX_RESULT_COUNT). */
export const RESULT_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Internal candidate pool size used by Prompt 2. It is always >= N. */
export const MIN_CANDIDATE_POOL = 1;

export const MAX_CANDIDATE_POOL = 20;

export const MIN_SCORE = 0;

export const MAX_SCORE = 100;

/** Results below this score are not displayed unless explicitly debugging. */
export const MIN_DISPLAY_SCORE = 70;

/** Calibrated score-to-verdict bands. The verdict is derived from score. */
export const SCORE_BANDS = {
  exceptional: { min: 95, max: 100, label: 'exceptional' },
  veryStrong: { min: 90, max: 94, label: 'very-strong' },
  strong: { min: 80, max: 89, label: 'strong' },
  medium: { min: 70, max: 79, label: 'medium' },
  weakToMedium: { min: 60, max: 69, label: 'weak-to-medium' },
  weak: { min: 50, max: 59, label: 'weak' },
  tooLow: { min: 0, max: 49, label: 'too-low' },
} as const;

/** Score cap applied when image quality is low or uncertainty is high. */
export const UNCERTAINTY_SCORE_CAP = 79;

/** Score cap applied when only a few visible traits are clear. */
export const LOW_TRAIT_COUNT_SCORE_CAP = 74;

/** Minimum number of strong aligned traits before a score can reach 90+. */
export const MIN_STRONG_TRAITS_FOR_HIGH_SCORE = 4;
