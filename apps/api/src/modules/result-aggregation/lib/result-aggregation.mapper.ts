import type { FinalGameResult, FinalResultItem, JudgedResult, Traits } from '@twinzy/shared';
import { NO_MATCH_FALLBACK_MESSAGE, RESULT_DISCLAIMER } from '@twinzy/shared';

/**
 * Map a displayable judged result to a final result item, assigning the
 * 1-based rank from its zero-based position in the ordered list.
 */
export const toFinalResultItem = (result: JudgedResult, index: number): FinalResultItem => ({
  name: result.name,
  rank: index + 1,
  finalStyleVibeFitScore: result.finalStyleVibeFitScore,
  verdict: result.verdict,
  reason: result.reason,
  matchingTraits: result.matchingTraits,
  weakOrUncertainTraits: result.weakOrUncertainTraits,
});

/**
 * Shape the successful response: the ranked items plus the fixed, server-side
 * disclaimer. The model's own disclaimer text is never trusted or forwarded.
 */
export const toFinalGameResult = (
  traits: Traits,
  displayable: readonly JudgedResult[],
): FinalGameResult => ({
  traits,
  results: displayable.map((result, index) => toFinalResultItem(result, index)),
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER,
});

/**
 * Shape the no-match fallback: no results, the friendly fallback message, and
 * the same fixed server-side disclaimer.
 */
export const toFallbackResult = (traits: Traits): FinalGameResult => ({
  traits,
  results: [],
  fallbackMessage: NO_MATCH_FALLBACK_MESSAGE,
  disclaimer: RESULT_DISCLAIMER,
});
