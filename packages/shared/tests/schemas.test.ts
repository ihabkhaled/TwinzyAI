import { describe, expect, it } from 'vitest';

import {
  CandidateGenerationResponseSchema,
  FinalGameResultSchema,
  HealthResponseSchema,
  RESULT_DISCLAIMER,
  TRAIT_KEYS,
  TraitExtractionResponseSchema,
} from '../src';

const buildTraits = (): Record<string, string> =>
  Object.fromEntries(TRAIT_KEYS.map((key) => [key, 'visible observation']));

const buildSafetyCheck = (): Record<string, boolean> => ({
  containsIdentityClaim: false,
  containsCelebrityComparison: false,
  containsSensitiveInference: false,
  containsFaceRecognitionClaim: false,
  containsBiometricClaim: false,
});

describe('TraitExtractionResponseSchema', () => {
  it('accepts a response with exactly 15 traits and a clean safety check', () => {
    const parsed = TraitExtractionResponseSchema.safeParse({
      traits: buildTraits(),
      safetyCheck: buildSafetyCheck(),
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects a response missing a trait field', () => {
    const traits = buildTraits();
    delete traits['faceShape'];

    const parsed = TraitExtractionResponseSchema.safeParse({
      traits,
      safetyCheck: buildSafetyCheck(),
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects a response with an extra unknown trait field', () => {
    const parsed = TraitExtractionResponseSchema.safeParse({
      traits: { ...buildTraits(), secretExtra: 'value' },
      safetyCheck: buildSafetyCheck(),
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects a response where the model flags an identity claim', () => {
    const parsed = TraitExtractionResponseSchema.safeParse({
      traits: buildTraits(),
      safetyCheck: { ...buildSafetyCheck(), containsIdentityClaim: true },
    });

    expect(parsed.success).toBe(false);
  });
});

const buildCandidate = (): Record<string, unknown> => ({
  name: 'Example Name',
  publicCategory: 'actor',
  countryOrRegion: 'Global',
  styleVibeFitScore: 82,
  reason: 'Similar public style impression from hair and jawline traits.',
  alignedTraits: ['hairColor'],
  weakOrUncertainTraits: ['eyeColorEyeShape'],
  safetyCheck: {
    containsFaceRecognitionClaim: false,
    containsBiometricClaim: false,
    containsIdentityClaim: false,
    containsExactLookalikeClaim: false,
  },
});

describe('CandidateGenerationResponseSchema', () => {
  it('accepts between 1 and 5 candidates', () => {
    const parsed = CandidateGenerationResponseSchema.safeParse({
      candidates: [buildCandidate()],
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects an empty candidate list', () => {
    const parsed = CandidateGenerationResponseSchema.safeParse({ candidates: [] });

    expect(parsed.success).toBe(false);
  });

  it('rejects more than 5 candidates', () => {
    const parsed = CandidateGenerationResponseSchema.safeParse({
      candidates: Array.from({ length: 6 }, buildCandidate),
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects an out-of-range score', () => {
    const parsed = CandidateGenerationResponseSchema.safeParse({
      candidates: [{ ...buildCandidate(), styleVibeFitScore: 130 }],
    });

    expect(parsed.success).toBe(false);
  });
});

describe('FinalGameResultSchema', () => {
  it('accepts an empty results list with a fallback message', () => {
    const parsed = FinalGameResultSchema.safeParse({
      traits: buildTraits(),
      results: [],
      fallbackMessage: 'No confident match this time.',
      disclaimer: RESULT_DISCLAIMER,
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects more than 4 final results', () => {
    const result = {
      name: 'Example Name',
      rank: 1,
      finalStyleVibeFitScore: 80,
      verdict: 'strong',
      reason: 'Shared style impression.',
      matchingTraits: [],
      weakOrUncertainTraits: [],
    };

    const parsed = FinalGameResultSchema.safeParse({
      traits: buildTraits(),
      results: Array.from({ length: 5 }, (_unused, index) => ({ ...result, rank: index + 1 })),
      fallbackMessage: '',
      disclaimer: RESULT_DISCLAIMER,
    });

    expect(parsed.success).toBe(false);
  });
});

describe('HealthResponseSchema', () => {
  it('accepts a valid health payload', () => {
    const parsed = HealthResponseSchema.safeParse({
      status: 'ok',
      service: 'twinzy-api',
      version: '0.1.0',
      uptimeSeconds: 12.5,
    });

    expect(parsed.success).toBe(true);
  });
});
