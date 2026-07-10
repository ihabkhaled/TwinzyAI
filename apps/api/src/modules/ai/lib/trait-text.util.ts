import type { TraitExtractionResponse, Traits } from '@twinzy/shared';

/**
 * Bound to the shared Traits shape: if the schema ever renames the notes
 * field this becomes a compile error instead of silently degrading the
 * safety sweep's coverage.
 */
const UNCERTAINTY_NOTES_KEY = 'uncertaintyNotes' satisfies keyof Traits;

/**
 * Flatten every localized text leaf of the nested trait payload: all 221
 * category field values plus each uncertainty-notes entry. Used by the safety
 * sweep so no free-text corner of the advanced structure escapes filtering.
 */
export const collectTraitTextValues = (traits: Traits): string[] => {
  const values: string[] = [];
  for (const [category, fields] of Object.entries(traits)) {
    if (category === UNCERTAINTY_NOTES_KEY) {
      for (const notes of Object.values(fields as Record<string, string[]>)) {
        values.push(...notes);
      }
      continue;
    }
    values.push(...Object.values(fields as Record<string, string>));
  }
  return values;
};

/** Every free-text leaf forwarded from extraction into downstream matching. */
export const collectExtractionTextValues = (response: TraitExtractionResponse): string[] => [
  ...collectTraitTextValues(response.traits),
  ...response.compactTraitSummary,
  ...response.highSignalTraitTokens,
  ...response.weightedTraitEvidence.map((evidence) => evidence.token),
  ...response.visualArchetypeHints,
  ...response.imageQualityCaps.flatMap((cap) => [cap.quality, cap.impact]),
  ...response.candidateSearchHints.flatMap((hint) => [hint.archetype, hint.why]),
];
