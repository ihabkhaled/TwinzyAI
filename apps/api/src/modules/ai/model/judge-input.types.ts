import type { Candidate, LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';

/**
 * Everything the text-only strict judge needs for one run: written extraction
 * evidence, candidate pool, output language, requested count, and cancel signal.
 */
export interface JudgeCandidatesInput {
  readonly extraction: TraitExtractionResponse;
  readonly candidates: readonly Candidate[];
  readonly languageCode: LanguageCodeValue;
  readonly resultCount: number;
  readonly signal?: AbortSignal | undefined;
}
