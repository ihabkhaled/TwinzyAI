import type { TraitExtractionResponse } from '@twinzy/shared';

import type { MatchingEvidence } from '../model/matching-evidence.types';

/**
 * Distills the extraction response into the evidence payload the candidate and
 * judge prompts receive. Every aggregate the extractor produces for matching is
 * included — this builder exists precisely because these fields were once
 * produced and then silently dropped on the way to the downstream prompts.
 */
export const buildMatchingEvidence = (extraction: TraitExtractionResponse): MatchingEvidence => ({
  traits: extraction.traits,
  compactTraitSummary: extraction.compactTraitSummary,
  highSignalTraitTokens: extraction.highSignalTraitTokens,
  weightedTraitEvidence: extraction.weightedTraitEvidence,
  visualArchetypeHints: extraction.visualArchetypeHints,
  imageQualityCaps: extraction.imageQualityCaps,
  candidateSearchHints: extraction.candidateSearchHints,
});
