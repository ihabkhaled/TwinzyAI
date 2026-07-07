import {
  GAME_PROMPT_VERSION,
  RESULT_DISCLAIMER,
  TOTAL_TRAIT_FIELDS,
  TRAIT_CATEGORY_FIELDS,
  UNCERTAINTY_NOTE_FIELDS,
} from '../../src';

/**
 * Deterministic advanced-global-traits-v2 fixture builders, generated from
 * the single taxonomy source so a taxonomy change updates every test at once.
 */

/** Full nested traits payload: every field of every category filled. */
export const buildTraitsPayload = (): Record<string, unknown> => ({
  ...Object.fromEntries(
    Object.entries(TRAIT_CATEGORY_FIELDS).map(([category, fields]) => [
      category,
      Object.fromEntries(fields.map((field) => [field, `observed ${field}`])),
    ]),
  ),
  uncertaintyNotes: Object.fromEntries(UNCERTAINTY_NOTE_FIELDS.map((field) => [field, []])),
});

export const buildCandidatePayload = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  name: 'Sample Star',
  publicCategory: 'actor',
  countryOrRegion: 'Global',
  globalPopularityLevel: 'high',
  styleVibeFitScore: 84,
  confidenceLevel: 'high',
  reason: 'Shares a similar public style impression from hair and jawline traits.',
  strongAlignedTraits: ['wavy dark hair'],
  mediumAlignedTraits: ['defined jawline'],
  weakOrUncertainTraits: ['eye color unclear'],
  majorMismatchRisks: [],
  whyThisCandidateWasChosen: 'Strong overlap across hair, jawline, and grooming style signals.',
  scoreExplanation: 'Most major visible traits align; a few remain unclear.',
  safetyCheck: {
    containsFaceRecognitionClaim: false,
    containsBiometricClaim: false,
    containsIdentityClaim: false,
    containsExactLookalikeClaim: false,
  },
  ...overrides,
});

export const buildJudgedResultPayload = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  name: 'Sample Star',
  rank: 1,
  finalStyleVibeFitScore: 82,
  confidenceLevel: 'high',
  verdict: 'strong',
  countryOrRegion: 'Global',
  publicCategory: 'actor',
  finalReason: 'Consistent style impression across major written traits.',
  topMatchingTraits: ['wavy dark hair'],
  secondaryMatchingTraits: ['defined jawline'],
  weakOrUncertainTraits: [],
  mismatchWarnings: [],
  judgeNotes: 'Score kept conservative because several traits were unclear.',
  shouldDisplay: true,
  ...overrides,
});

/** Full valid FinalGameResult payload with 5 ranked results by default. */
export const buildFinalResultPayload = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  traitCount: TOTAL_TRAIT_FIELDS,
  traits: buildTraitsPayload(),
  compactTraitSummary: ['clear oval face', 'wavy dark hair'],
  results: Array.from({ length: 5 }, (_unused, index) => ({
    name: `Sample Star ${index + 1}`,
    rank: index + 1,
    finalStyleVibeFitScore: 90 - index * 3,
    confidenceLevel: 'high',
    verdict: 'strong',
    countryOrRegion: 'Global',
    publicCategory: 'actor',
    finalReason: 'Consistent style impression across major written traits.',
    topMatchingTraits: ['wavy dark hair'],
    secondaryMatchingTraits: [],
    weakOrUncertainTraits: [],
    mismatchWarnings: [],
    judgeNotes: 'Conservative score.',
  })),
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER,
  ...overrides,
});
