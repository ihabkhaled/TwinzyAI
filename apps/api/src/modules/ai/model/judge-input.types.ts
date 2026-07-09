import type { Candidate, LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';

import type { AiImageInput } from './gemini.types';

/**
 * Everything the strict judge needs for one run: the photo, the full extraction
 * evidence, the candidate pool, the output language, the requested display
 * count, and the run's cancel signal.
 */
export interface JudgeCandidatesInput {
  readonly extraction: TraitExtractionResponse;
  readonly candidates: readonly Candidate[];
  readonly image: AiImageInput;
  readonly languageCode: LanguageCodeValue;
  readonly resultCount: number;
  readonly signal?: AbortSignal | undefined;
}
