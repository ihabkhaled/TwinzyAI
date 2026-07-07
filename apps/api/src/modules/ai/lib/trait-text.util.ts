import type { TraitExtractionResponse, Traits } from '@twinzy/shared';

/**
 * Flatten every localized text leaf of the nested trait payload: all 221
 * category field values plus each uncertainty-notes entry. Used by the safety
 * sweep so no free-text corner of the advanced structure escapes filtering.
 */
export const collectTraitTextValues = (traits: Traits): string[] => {
  const values: string[] = [];
  for (const [category, fields] of Object.entries(traits)) {
    if (category === 'uncertaintyNotes') {
      for (const notes of Object.values(fields as Record<string, string[]>)) {
        values.push(...notes);
      }
      continue;
    }
    values.push(...Object.values(fields as Record<string, string>));
  }
  return values;
};

/** All free-text leaves of a full extraction response (traits + summary). */
export const collectExtractionTextValues = (response: TraitExtractionResponse): string[] => [
  ...collectTraitTextValues(response.traits),
  ...response.compactTraitSummary,
];
