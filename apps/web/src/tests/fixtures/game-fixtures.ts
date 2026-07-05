import type { FinalGameResult } from '@twinzy/shared';
import { RESULT_DISCLAIMER, TRAIT_KEYS } from '@twinzy/shared';

export const buildFinalResult = (
  overrides: Partial<FinalGameResult> = {},
): FinalGameResult => ({
  traits: Object.fromEntries(
    TRAIT_KEYS.map((key) => [key, `observed ${key}`]),
  ) as FinalGameResult['traits'],
  results: [
    {
      name: 'Sample Star',
      rank: 1,
      finalStyleVibeFitScore: 87,
      verdict: 'strong',
      reason: 'Shares a similar public style impression based on hair and jawline traits.',
      matchingTraits: ['hairColor', 'jawlineChinOverallStructure'],
      weakOrUncertainTraits: ['eyeColorEyeShape'],
    },
  ],
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER,
  ...overrides,
});

export const buildImageFile = (name = 'photo.jpg', type = 'image/jpeg', sizeBytes = 2048): File => {
  const content = new Uint8Array(sizeBytes).fill(65);
  return new File([content], name, { type });
};
