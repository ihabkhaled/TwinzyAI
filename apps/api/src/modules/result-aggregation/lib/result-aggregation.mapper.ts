import type {
  FinalGameResult,
  FinalResultItem,
  JudgedResult,
  LanguageCodeValue,
  TraitExtractionResponse,
} from '@twinzy/shared';
import {
  GAME_PROMPT_VERSION,
  NO_MATCH_FALLBACK_BY_LANGUAGE,
  RESULT_DISCLAIMER_BY_LANGUAGE,
} from '@twinzy/shared';

/**
 * Map a displayable judged result to a final result item, assigning the
 * 1-based rank from its zero-based position in the ordered list.
 */
export const toFinalResultItem = (result: JudgedResult, index: number): FinalResultItem => ({
  name: result.name,
  rank: index + 1,
  finalStyleVibeFitScore: result.finalStyleVibeFitScore,
  confidenceLevel: result.confidenceLevel,
  verdict: result.verdict,
  countryOrRegion: result.countryOrRegion,
  publicCategory: result.publicCategory,
  finalReason: result.finalReason,
  topMatchingTraits: result.topMatchingTraits,
  secondaryMatchingTraits: result.secondaryMatchingTraits,
  weakOrUncertainTraits: result.weakOrUncertainTraits,
  mismatchWarnings: result.mismatchWarnings,
  judgeNotes: result.judgeNotes,
  safetyCheck: result.safetyCheck,
});

/**
 * Shape the successful response: the ranked items, the advanced trait
 * payload + summary, and the fixed SERVER-SIDE localized disclaimer. The
 * model's own disclaimer text is never trusted or forwarded, and the judge's
 * removedCandidates list never reaches the client.
 */
export const toFinalGameResult = (
  extraction: TraitExtractionResponse,
  displayable: readonly JudgedResult[],
  languageCode: LanguageCodeValue,
  resultCount: number,
): FinalGameResult => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode,
  resultCount,
  traitCount: extraction.traitCount,
  traits: extraction.traits,
  compactTraitSummary: extraction.compactTraitSummary,
  results: displayable.map((result, index) => toFinalResultItem(result, index)),
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER_BY_LANGUAGE[languageCode],
});

/**
 * Shape the no-match fallback: no results, the SERVER-SIDE localized fallback
 * message, and the same fixed localized disclaimer.
 */
export const toFallbackResult = (
  extraction: TraitExtractionResponse,
  languageCode: LanguageCodeValue,
  resultCount: number,
): FinalGameResult => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode,
  resultCount,
  traitCount: extraction.traitCount,
  traits: extraction.traits,
  compactTraitSummary: extraction.compactTraitSummary,
  results: [],
  fallbackMessage: NO_MATCH_FALLBACK_BY_LANGUAGE[languageCode],
  disclaimer: RESULT_DISCLAIMER_BY_LANGUAGE[languageCode],
});
