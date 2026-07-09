import type { TraitExtractionResponse } from '@twinzy/shared';

/**
 * The distilled extraction signal delivered to BOTH the candidate-generation
 * and judge prompts alongside the photo: the full trait taxonomy plus every
 * aggregate the extractor produced for matching (compact summary, high-signal
 * tokens, weighted evidence, archetype hints, image-quality caps, and the
 * candidate search directions). Derived with Pick so schema evolution cannot
 * silently drop a field from the prompts again.
 */
export type MatchingEvidence = Pick<
  TraitExtractionResponse,
  | 'traits'
  | 'compactTraitSummary'
  | 'highSignalTraitTokens'
  | 'weightedTraitEvidence'
  | 'visualArchetypeHints'
  | 'imageQualityCaps'
  | 'candidateSearchHints'
>;
