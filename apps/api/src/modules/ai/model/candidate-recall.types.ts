import type { LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';

/**
 * Everything candidate recall needs: written extraction evidence, output
 * language, requested count, and the shared analysis cancel signal every lane
 * inherits. There is deliberately no image field — recall is text-only.
 */
export interface CandidateRecallInput {
  readonly extraction: TraitExtractionResponse;
  readonly languageCode: LanguageCodeValue;
  readonly resultCount: number;
  readonly signal?: AbortSignal | undefined;
}
