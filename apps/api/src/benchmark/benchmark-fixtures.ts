import {
  GAME_PROMPT_VERSION,
  RESULT_DISCLAIMER,
  TOTAL_TRAIT_FIELDS,
  TRAIT_CATEGORY_FIELDS,
  UNCERTAINTY_NOTE_FIELDS,
} from '@twinzy/shared';

import type { GeminiStepValue } from '../config/gemini-step.constants';
import { GeminiStep } from '../config/gemini-step.constants';

/**
 * Self-contained canned model responses for MOCK benchmark runs (the build
 * excludes `src/tests/**`, so these deliberately do not import test fixtures).
 * Each step gets a schema-valid response, a schema-broken response, and an
 * unsafe-wording response so the harness demonstrably measures all three axes.
 */

const buildTraits = (): Record<string, unknown> => ({
  ...Object.fromEntries(
    Object.entries(TRAIT_CATEGORY_FIELDS).map(([category, fields]) => [
      category,
      Object.fromEntries(fields.map((field) => [field, `observed ${field}`])),
    ]),
  ),
  uncertaintyNotes: Object.fromEntries(UNCERTAINTY_NOTE_FIELDS.map((field) => [field, []])),
});

const traitSafetyCheck = {
  containsIdentityClaim: false,
  containsCelebrityComparison: false,
  containsSensitiveInference: false,
  containsFaceRecognitionClaim: false,
  containsBiometricClaim: false,
} as const;

const judgeSafetyCheck = {
  containsFaceRecognitionClaim: false,
  containsBiometricClaim: false,
  containsIdentityClaim: false,
  containsExactLookalikeClaim: false,
  containsSensitiveInference: false,
  meetsMinimumEvidence: true,
} as const;

const buildExtractionResponse = (): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  traitCount: TOTAL_TRAIT_FIELDS,
  traits: buildTraits(),
  compactTraitSummary: ['clear oval face', 'wavy dark hair'],
  highSignalTraitTokens: ['oval face', 'wavy dark hair'],
  weightedTraitEvidence: [{ token: 'oval face', weight: 9 }],
  visualArchetypeHints: ['warm rounded features'],
  imageQualityCaps: [{ quality: 'clear', impact: 'good lighting' }],
  candidateSearchHints: [{ archetype: 'warm approachable style', why: 'rounded face + smile' }],
  safetyCheck: traitSafetyCheck,
});

const buildCandidate = (unsafeReason?: string): Record<string, unknown> => ({
  name: 'Sample Star',
  publicCategory: 'actor',
  countryOrRegion: 'Global',
  globalPopularityLevel: 'high',
  styleVibeFitScore: 84,
  confidenceLevel: 'high',
  reason: unsafeReason ?? 'Shares a similar public style impression from hair and jawline traits.',
  strongAlignedTraits: ['wavy dark hair'],
  mediumAlignedTraits: [],
  weakOrUncertainTraits: [],
  majorMismatchRisks: [],
  whyThisCandidateWasChosen: 'Strong overlap across visible style signals.',
  scoreExplanation: 'Most major visible traits align.',
  safetyCheck: {
    containsFaceRecognitionClaim: false,
    containsBiometricClaim: false,
    containsIdentityClaim: false,
    containsExactLookalikeClaim: false,
  },
});

const buildGenerationResponse = (unsafeReason?: string): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  resultCount: 1,
  candidateCount: 1,
  candidates: [buildCandidate(unsafeReason)],
  fallbackMessage: '',
});

const buildJudgedResult = (unsafeReason?: string): Record<string, unknown> => ({
  name: 'Sample Star',
  rank: 1,
  finalStyleVibeFitScore: 82,
  confidenceLevel: 'high',
  verdict: 'strong',
  countryOrRegion: 'Global',
  publicCategory: 'actor',
  finalReason: unsafeReason ?? 'Consistent style impression across major written traits.',
  topMatchingTraits: ['wavy dark hair'],
  secondaryMatchingTraits: [],
  weakOrUncertainTraits: [],
  mismatchWarnings: [],
  judgeNotes: 'Score kept conservative.',
  shouldDisplay: true,
  safetyCheck: judgeSafetyCheck,
});

const buildJudgeResponse = (unsafeReason?: string): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  resultCount: 1,
  results: [buildJudgedResult(unsafeReason)],
  removedCandidates: [],
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER,
});

const buildFinalResultItem = (unsafeReason?: string): Record<string, unknown> => {
  const item = buildJudgedResult(unsafeReason);
  delete item['shouldDisplay'];
  return item;
};

const buildTranslationResponse = (unsafeReason?: string): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'ar',
  resultCount: 1,
  traitCount: TOTAL_TRAIT_FIELDS,
  traits: buildTraits(),
  compactTraitSummary: ['وجه بيضاوي واضح'],
  results: [buildFinalResultItem(unsafeReason)],
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER,
});

/** The phrase guaranteed to trip the safety wording filter. */
const UNSAFE_PHRASE = 'This is a face recognition and identity match verdict.';

const VALID_BY_STEP: Record<GeminiStepValue, () => Record<string, unknown>> = {
  [GeminiStep.Extraction]: buildExtractionResponse,
  [GeminiStep.Generation]: buildGenerationResponse,
  [GeminiStep.Judge]: buildJudgeResponse,
  [GeminiStep.Translation]: buildTranslationResponse,
};

const UNSAFE_BY_STEP: Record<GeminiStepValue, () => Record<string, unknown>> = {
  [GeminiStep.Extraction]: buildExtractionResponse,
  [GeminiStep.Generation]: () => buildGenerationResponse(UNSAFE_PHRASE),
  [GeminiStep.Judge]: () => buildJudgeResponse(UNSAFE_PHRASE),
  [GeminiStep.Translation]: () => buildTranslationResponse(UNSAFE_PHRASE),
};

/** Schema-valid canned response text for a step. */
export const buildValidResponseText = (step: GeminiStepValue): string =>
  JSON.stringify(VALID_BY_STEP[step]());

/** Structurally broken response text (schema must reject it). */
export const buildBrokenResponseText = (): string => '{"totally":"unrelated"}';

/** Schema-valid but unsafe-worded response text (safety scan must flag it). */
export const buildUnsafeResponseText = (step: GeminiStepValue): string =>
  JSON.stringify(UNSAFE_BY_STEP[step]());
