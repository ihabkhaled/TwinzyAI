import type { FinalGameResult, Traits } from '@twinzy/shared';
import {
  DEFAULT_RESULT_COUNT,
  GAME_PROMPT_VERSION,
  RESULT_DISCLAIMER,
  TOTAL_TRAIT_FIELDS,
  TRAIT_CATEGORY_FIELDS,
  UNCERTAINTY_NOTE_FIELDS,
} from '@twinzy/shared';

import { DEFAULT_TEST_IMAGE_SIZE_BYTES } from '../model/game.constants';

/** Full nested advanced traits: every field of every category filled. */
const buildTraits = (): Traits =>
  ({
    ...Object.fromEntries(
      Object.entries(TRAIT_CATEGORY_FIELDS).map(([category, fields]) => [
        category,
        Object.fromEntries(fields.map((field) => [field, `observed ${field}`])),
      ]),
    ),
    uncertaintyNotes: {
      ...Object.fromEntries(UNCERTAINTY_NOTE_FIELDS.map((field) => [field, []])),
      imageLimitations: ['slightly dim lighting'],
    },
  }) as unknown as Traits;

const buildJudgeSafetyCheck = (meetsMinimumEvidence = true) =>
  ({
    containsFaceRecognitionClaim: false,
    containsBiometricClaim: false,
    containsIdentityClaim: false,
    containsExactLookalikeClaim: false,
    containsSensitiveInference: false,
    meetsMinimumEvidence,
  }) as const;

/** A full, valid advanced FinalGameResult with one ranked match. */
export const buildFinalResult = (overrides: Partial<FinalGameResult> = {}): FinalGameResult => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  resultCount: DEFAULT_RESULT_COUNT,
  traitCount: TOTAL_TRAIT_FIELDS,
  traits: buildTraits(),
  compactTraitSummary: ['clear oval face', 'wavy dark hair'],
  results: [
    {
      name: 'Sample Star',
      rank: 1,
      finalStyleVibeFitScore: 84,
      confidenceLevel: 'high',
      verdict: 'strong',
      countryOrRegion: 'Global',
      publicCategory: 'actor',
      finalReason: 'Consistent public style impression across major written traits.',
      topMatchingTraits: ['wavy dark hair'],
      secondaryMatchingTraits: ['defined jawline'],
      weakOrUncertainTraits: ['eye color unclear'],
      mismatchWarnings: [],
      judgeNotes: 'Score kept conservative.',
      safetyCheck: buildJudgeSafetyCheck(),
    },
  ],
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER,
  ...overrides,
});

/** In-memory JPEG file for upload-flow tests. */
export const buildImageFile = (
  name = 'photo.jpg',
  type = 'image/jpeg',
  size = DEFAULT_TEST_IMAGE_SIZE_BYTES,
): File => {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
};

/**
 * Key-echo translator for pure helper/mapper tests; only the share template
 * interpolates so share-text assertions stay readable.
 */
export const fakeTranslate = (key: string, values?: Record<string, string | number>): string => {
  if (key === 'result.shareTemplate' && values !== undefined) {
    return `I tried this fun vibe game and got: ${String(values['name'])} with ${String(values['score'])}% style/vibe fit.`;
  }
  return key;
};
