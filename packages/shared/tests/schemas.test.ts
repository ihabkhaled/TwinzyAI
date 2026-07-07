import { describe, expect, it } from 'vitest';

import {
  CandidateGenerationResponseSchema,
  CandidateJudgeResponseSchema,
  FinalGameResultSchema,
  GAME_PROMPT_VERSION,
  HealthResponseSchema,
  LanguageCodeSchema,
  MAX_COMPACT_TRAIT_SUMMARY,
  RESULT_DISCLAIMER,
  TOTAL_TRAIT_FIELDS,
  TRAIT_CATEGORY_FIELDS,
  TraitExtractionResponseSchema,
  TranslateResultRequestSchema,
  UNCERTAINTY_NOTE_FIELDS,
} from '../src';

import {
  buildCandidatePayload,
  buildFinalResultPayload,
  buildJudgedResultPayload,
  buildTraitsPayload,
} from './fixtures/advanced-fixtures';

const buildSafetyCheck = (): Record<string, boolean> => ({
  containsIdentityClaim: false,
  containsCelebrityComparison: false,
  containsSensitiveInference: false,
  containsFaceRecognitionClaim: false,
  containsBiometricClaim: false,
});

const buildExtraction = (): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  traitCount: TOTAL_TRAIT_FIELDS,
  traits: buildTraitsPayload(),
  compactTraitSummary: ['clear oval face', 'wavy dark hair'],
  safetyCheck: buildSafetyCheck(),
});

describe('trait taxonomy', () => {
  it('defines 100+ named trait fields across 16 categories', () => {
    expect(Object.keys(TRAIT_CATEGORY_FIELDS)).toHaveLength(16);
    expect(TOTAL_TRAIT_FIELDS).toBeGreaterThanOrEqual(100);
  });
});

describe('LanguageCodeSchema', () => {
  it('accepts supported codes and rejects unknown ones', () => {
    expect(LanguageCodeSchema.safeParse('en').success).toBe(true);
    expect(LanguageCodeSchema.safeParse('ar').success).toBe(true);
    expect(LanguageCodeSchema.safeParse('xx').success).toBe(false);
  });
});

describe('TraitExtractionResponseSchema', () => {
  it('accepts a full advanced nested response', () => {
    expect(TraitExtractionResponseSchema.safeParse(buildExtraction()).success).toBe(true);
  });

  it('requires the exact prompt version', () => {
    const parsed = TraitExtractionResponseSchema.safeParse({
      ...buildExtraction(),
      promptVersion: 'v1',
    });
    expect(parsed.success).toBe(false);
  });

  it('requires languageCode and traitCount', () => {
    const withoutLanguage = { ...buildExtraction() };
    delete withoutLanguage['languageCode'];
    expect(TraitExtractionResponseSchema.safeParse(withoutLanguage).success).toBe(false);

    const withoutCount = { ...buildExtraction() };
    delete withoutCount['traitCount'];
    expect(TraitExtractionResponseSchema.safeParse(withoutCount).success).toBe(false);
  });

  it('rejects a response missing a whole category', () => {
    const traits = buildTraitsPayload();
    delete traits['eyes'];
    expect(TraitExtractionResponseSchema.safeParse({ ...buildExtraction(), traits }).success).toBe(
      false,
    );
  });

  it('rejects a response missing a single category field', () => {
    const traits = buildTraitsPayload();
    const hair = { ...(traits['hair'] as Record<string, unknown>) };
    delete hair['hairColor'];
    expect(
      TraitExtractionResponseSchema.safeParse({ ...buildExtraction(), traits: { ...traits, hair } })
        .success,
    ).toBe(false);
  });

  it('rejects extra unknown fields inside a category', () => {
    const traits = buildTraitsPayload();
    const hair = { ...(traits['hair'] as Record<string, unknown>), secretExtra: 'value' };
    expect(
      TraitExtractionResponseSchema.safeParse({ ...buildExtraction(), traits: { ...traits, hair } })
        .success,
    ).toBe(false);
  });

  it('bounds the compact summary and uncertainty-note arrays', () => {
    const oversizedSummary = Array.from(
      { length: MAX_COMPACT_TRAIT_SUMMARY + 1 },
      (_unused, index) => `signal ${index}`,
    );
    expect(
      TraitExtractionResponseSchema.safeParse({
        ...buildExtraction(),
        compactTraitSummary: oversizedSummary,
      }).success,
    ).toBe(false);

    const traits = buildTraitsPayload();
    traits['uncertaintyNotes'] = {
      ...Object.fromEntries(UNCERTAINTY_NOTE_FIELDS.map((field) => [field, []])),
      imageLimitations: Array.from({ length: 11 }, (_unused, index) => `note ${index}`),
    };
    expect(TraitExtractionResponseSchema.safeParse({ ...buildExtraction(), traits }).success).toBe(
      false,
    );
  });

  it('rejects a too-long trait string', () => {
    const traits = buildTraitsPayload();
    const hair = { ...(traits['hair'] as Record<string, unknown>), hairColor: 'x'.repeat(301) };
    expect(
      TraitExtractionResponseSchema.safeParse({ ...buildExtraction(), traits: { ...traits, hair } })
        .success,
    ).toBe(false);
  });

  it('rejects a response where the model flags an identity claim or comparison', () => {
    for (const flag of [
      'containsIdentityClaim',
      'containsCelebrityComparison',
      'containsSensitiveInference',
    ]) {
      const parsed = TraitExtractionResponseSchema.safeParse({
        ...buildExtraction(),
        safetyCheck: { ...buildSafetyCheck(), [flag]: true },
      });
      expect(parsed.success).toBe(false);
    }
  });
});

const buildGeneration = (candidates: Record<string, unknown>[]): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  candidateCount: candidates.length,
  candidates,
  fallbackMessage: '',
});

describe('CandidateGenerationResponseSchema', () => {
  it('accepts between 1 and 5 candidates', () => {
    expect(
      CandidateGenerationResponseSchema.safeParse(buildGeneration([buildCandidatePayload()]))
        .success,
    ).toBe(true);
  });

  it('rejects an empty candidate list and more than 5 candidates', () => {
    expect(CandidateGenerationResponseSchema.safeParse(buildGeneration([])).success).toBe(false);
    expect(
      CandidateGenerationResponseSchema.safeParse(
        buildGeneration(Array.from({ length: 6 }, () => buildCandidatePayload())),
      ).success,
    ).toBe(false);
  });

  it('rejects a candidateCount that disagrees with the list length', () => {
    const payload = buildGeneration([buildCandidatePayload()]);
    payload['candidateCount'] = 3;
    expect(CandidateGenerationResponseSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects an out-of-range score and a missing languageCode', () => {
    expect(
      CandidateGenerationResponseSchema.safeParse(
        buildGeneration([buildCandidatePayload({ styleVibeFitScore: 130 })]),
      ).success,
    ).toBe(false);

    const payload = buildGeneration([buildCandidatePayload()]);
    delete payload['languageCode'];
    expect(CandidateGenerationResponseSchema.safeParse(payload).success).toBe(false);
  });
});

const buildJudgeResponse = (results: Record<string, unknown>[]): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  results,
  removedCandidates: [],
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER,
});

describe('CandidateJudgeResponseSchema', () => {
  it('accepts up to 5 judged results and rejects more', () => {
    const five = Array.from({ length: 5 }, (_unused, index) =>
      buildJudgedResultPayload({ rank: index + 1 }),
    );
    expect(CandidateJudgeResponseSchema.safeParse(buildJudgeResponse(five)).success).toBe(true);

    const six = Array.from({ length: 6 }, (_unused, index) =>
      buildJudgedResultPayload({ rank: index + 1 }),
    );
    expect(CandidateJudgeResponseSchema.safeParse(buildJudgeResponse(six)).success).toBe(false);
  });

  it('bounds removedCandidates and requires the disclaimer', () => {
    const tooManyRemoved = buildJudgeResponse([buildJudgedResultPayload()]);
    tooManyRemoved['removedCandidates'] = Array.from({ length: 6 }, (_unused, index) => ({
      name: `Removed ${index}`,
      reasonRemoved: 'unsafe wording',
    }));
    expect(CandidateJudgeResponseSchema.safeParse(tooManyRemoved).success).toBe(false);

    const withoutDisclaimer = buildJudgeResponse([buildJudgedResultPayload()]);
    delete withoutDisclaimer['disclaimer'];
    expect(CandidateJudgeResponseSchema.safeParse(withoutDisclaimer).success).toBe(false);
  });
});

describe('FinalGameResultSchema', () => {
  it('accepts an empty results list with a fallback message', () => {
    expect(
      FinalGameResultSchema.safeParse(
        buildFinalResultPayload({ results: [], fallbackMessage: 'No confident match this time.' }),
      ).success,
    ).toBe(true);
  });

  it('accepts exactly 5 final results and rejects 6', () => {
    const five = buildFinalResultPayload();
    expect(FinalGameResultSchema.safeParse(five).success).toBe(true);
    expect(five['results'] as unknown[]).toHaveLength(5);

    const results = buildFinalResultPayload()['results'] as Record<string, unknown>[];
    const six = buildFinalResultPayload({
      results: [...results, { ...results[0], rank: 6 }],
    });
    expect(FinalGameResultSchema.safeParse(six).success).toBe(false);
  });
});

describe('TranslateResultRequestSchema', () => {
  it('accepts a target language + existing result and rejects unknown keys', () => {
    expect(
      TranslateResultRequestSchema.safeParse({
        targetLanguageCode: 'ar',
        result: buildFinalResultPayload(),
      }).success,
    ).toBe(true);

    expect(
      TranslateResultRequestSchema.safeParse({
        targetLanguageCode: 'ar',
        result: buildFinalResultPayload(),
        image: 'base64-something',
      }).success,
    ).toBe(false);
  });

  it('rejects an unsupported target language', () => {
    expect(
      TranslateResultRequestSchema.safeParse({
        targetLanguageCode: 'xx',
        result: buildFinalResultPayload(),
      }).success,
    ).toBe(false);
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
