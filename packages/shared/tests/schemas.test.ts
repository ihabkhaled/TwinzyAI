import { describe, expect, it } from 'vitest';

import {
  ApiErrorResponseSchema,
  CandidateGenerationResponseSchema,
  CandidateJudgeResponseSchema,
  FinalGameResultSchema,
  GAME_PROMPT_VERSION,
  HealthResponseSchema,
  LanguageCodeSchema,
  MAX_COMPACT_TRAIT_SUMMARY,
  NO_MATCH_FALLBACK_MESSAGE,
  RESULT_DISCLAIMER,
  ResultCountSchema,
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
  highSignalTraitTokens: ['oval face', 'wavy dark hair', 'full beard', 'broad smile'],
  weightedTraitEvidence: [
    { token: 'oval face', weight: 9 },
    { token: 'wavy dark hair', weight: 8 },
  ],
  visualArchetypeHints: ['warm-friendly-rounded'],
  imageQualityCaps: [{ quality: 'clear', impact: 'good lighting' }],
  candidateSearchHints: [
    { archetype: 'warm approachable public style', why: 'matches rounded face and smile' },
  ],
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

  it('requires languageCode but derives traitCount when the model omits it', () => {
    const withoutLanguage = { ...buildExtraction() };
    delete withoutLanguage['languageCode'];
    expect(TraitExtractionResponseSchema.safeParse(withoutLanguage).success).toBe(false);

    const withoutCount = { ...buildExtraction() };
    delete withoutCount['traitCount'];
    const parsed = TraitExtractionResponseSchema.safeParse(withoutCount);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.traitCount).toBe(TOTAL_TRAIT_FIELDS);
  });

  it('rejects a response missing a whole category', () => {
    const traits = buildTraitsPayload();
    delete traits['eyes'];
    expect(TraitExtractionResponseSchema.safeParse({ ...buildExtraction(), traits }).success).toBe(
      false,
    );
  });

  it('tolerates a missing single category field (drops it) instead of failing', () => {
    const traits = buildTraitsPayload();
    const hair = { ...(traits['hair'] as Record<string, unknown>) };
    delete hair['hairColor'];
    const parsed = TraitExtractionResponseSchema.safeParse({
      ...buildExtraction(),
      traits: { ...traits, hair },
    });
    expect(parsed.success).toBe(true);
    expect(
      parsed.success && (parsed.data.traits.hair as Record<string, unknown>)['hairColor'],
    ).toBeUndefined();
  });

  it('strips extra unknown fields inside a category instead of failing', () => {
    const traits = buildTraitsPayload();
    const hair = { ...(traits['hair'] as Record<string, unknown>), secretExtra: 'value' };
    const parsed = TraitExtractionResponseSchema.safeParse({
      ...buildExtraction(),
      traits: { ...traits, hair },
    });
    expect(parsed.success).toBe(true);
    expect(
      parsed.success && (parsed.data.traits.hair as Record<string, unknown>)['secretExtra'],
    ).toBeUndefined();
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

  it('drops a too-long trait string instead of failing the whole extraction', () => {
    const traits = buildTraitsPayload();
    const hair = { ...(traits['hair'] as Record<string, unknown>), hairColor: 'x'.repeat(301) };
    const parsed = TraitExtractionResponseSchema.safeParse({
      ...buildExtraction(),
      traits: { ...traits, hair },
    });
    expect(parsed.success).toBe(true);
    // A too-long value is dropped to an empty (unobserved) field, not surfaced.
    expect(
      parsed.success && (parsed.data.traits.hair as Record<string, unknown>)['hairColor'],
    ).toBeFalsy();
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

const buildGeneration = (
  candidates: Record<string, unknown>[],
  resultCount = 10,
): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  resultCount,
  candidateCount: candidates.length,
  candidates,
  fallbackMessage: '',
});

describe('CandidateGenerationResponseSchema', () => {
  it('accepts between 1 and 25 generated candidates as long as the pool is at least resultCount', () => {
    expect(
      CandidateGenerationResponseSchema.safeParse(buildGeneration([buildCandidatePayload()], 1))
        .success,
    ).toBe(true);
    expect(
      CandidateGenerationResponseSchema.safeParse(
        buildGeneration(
          Array.from({ length: 25 }, () => buildCandidatePayload()),
          10,
        ),
      ).success,
    ).toBe(true);
  });

  it('rejects an empty list and >25 candidates, but tolerates a pool smaller than resultCount', () => {
    expect(CandidateGenerationResponseSchema.safeParse(buildGeneration([])).success).toBe(false);
    // A pool smaller than the requested count is fine — the judge just has less
    // to work with; the old "pool must be >= resultCount" rule burned fallbacks.
    expect(
      CandidateGenerationResponseSchema.safeParse(buildGeneration([buildCandidatePayload()], 5))
        .success,
    ).toBe(true);
    expect(
      CandidateGenerationResponseSchema.safeParse(
        buildGeneration(Array.from({ length: 26 }, () => buildCandidatePayload())),
      ).success,
    ).toBe(false);
  });

  it('derives candidateCount from the list length, ignoring the model self-report', () => {
    const payload = buildGeneration([buildCandidatePayload()]);
    payload['candidateCount'] = 3;
    const parsed = CandidateGenerationResponseSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.candidateCount).toBe(1);
  });

  it('normalizes a resultCount outside 1-10 instead of failing', () => {
    expect(
      CandidateGenerationResponseSchema.safeParse(
        buildGeneration(
          Array.from({ length: 11 }, () => buildCandidatePayload()),
          11,
        ),
      ).success,
    ).toBe(true);
    expect(
      CandidateGenerationResponseSchema.safeParse(
        buildGeneration(
          Array.from({ length: 10 }, () => buildCandidatePayload()),
          0,
        ),
      ).success,
    ).toBe(true);
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

const buildJudgeResponse = (
  results: Record<string, unknown>[],
  resultCount = 10,
): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  resultCount,
  results,
  removedCandidates: [],
  fallbackMessage: results.length === 0 ? NO_MATCH_FALLBACK_MESSAGE : '',
  disclaimer: RESULT_DISCLAIMER,
});

describe('CandidateJudgeResponseSchema', () => {
  it('accepts up to 10 judged results and rejects more', () => {
    const ten = Array.from({ length: 10 }, (_unused, index) =>
      buildJudgedResultPayload({ rank: index + 1, name: `Sample Star ${index + 1}` }),
    );
    expect(CandidateJudgeResponseSchema.safeParse(buildJudgeResponse(ten)).success).toBe(true);

    const eleven = Array.from({ length: 11 }, (_unused, index) =>
      buildJudgedResultPayload({ rank: index + 1 }),
    );
    expect(CandidateJudgeResponseSchema.safeParse(buildJudgeResponse(eleven)).success).toBe(false);
  });

  it('tolerates more results than the requested resultCount (the backend caps them)', () => {
    const payload = buildJudgeResponse(
      Array.from({ length: 5 }, (_unused, index) => buildJudgedResultPayload({ rank: index + 1 })),
      3,
    );
    expect(CandidateJudgeResponseSchema.safeParse(payload).success).toBe(true);
  });

  it('requires a non-empty fallbackMessage when results are empty', () => {
    const empty = buildJudgeResponse([], 10);
    empty['fallbackMessage'] = '';
    expect(CandidateJudgeResponseSchema.safeParse(empty).success).toBe(false);
  });

  it('bounds removedCandidates but tolerates a missing disclaimer (backend overrides it)', () => {
    const tooManyRemoved = buildJudgeResponse([buildJudgedResultPayload()]);
    tooManyRemoved['removedCandidates'] = Array.from({ length: 26 }, (_unused, index) => ({
      name: `Removed ${index}`,
      reasonRemoved: 'unsafe wording',
    }));
    expect(CandidateJudgeResponseSchema.safeParse(tooManyRemoved).success).toBe(false);

    const withoutDisclaimer = buildJudgeResponse([buildJudgedResultPayload()]);
    delete withoutDisclaimer['disclaimer'];
    const parsed = CandidateJudgeResponseSchema.safeParse(withoutDisclaimer);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.disclaimer).toBe('');
  });

  it('tolerates a non-numeric or missing rank instead of dropping the whole batch', () => {
    const stringRank = buildJudgeResponse([buildJudgedResultPayload({ rank: 'two' })]);
    const parsedString = CandidateJudgeResponseSchema.safeParse(stringRank);
    expect(parsedString.success).toBe(true);
    expect(parsedString.success && parsedString.data.results[0]?.rank).toBe(1);

    const results = [buildJudgedResultPayload()];
    delete results[0]?.['rank'];
    const missingRank = buildJudgeResponse(results);
    expect(CandidateJudgeResponseSchema.safeParse(missingRank).success).toBe(true);
  });
});

describe('FinalGameResultSchema', () => {
  it('accepts an empty results list with a fallback message', () => {
    expect(
      FinalGameResultSchema.safeParse(
        buildFinalResultPayload({ results: [], fallbackMessage: NO_MATCH_FALLBACK_MESSAGE }),
      ).success,
    ).toBe(true);
  });

  it('rejects an empty results list without a fallback message', () => {
    expect(
      FinalGameResultSchema.safeParse(buildFinalResultPayload({ results: [], fallbackMessage: '' }))
        .success,
    ).toBe(false);
  });

  it('accepts exactly 10 final results and rejects 11', () => {
    const ten = buildFinalResultPayload();
    expect(FinalGameResultSchema.safeParse(ten).success).toBe(true);
    expect(ten['results'] as unknown[]).toHaveLength(10);

    const results = buildFinalResultPayload()['results'] as Record<string, unknown>[];
    const eleven = buildFinalResultPayload({
      results: [...results, { ...results[0], rank: 11 }],
    });
    expect(FinalGameResultSchema.safeParse(eleven).success).toBe(false);
  });

  it('rejects results that exceed the requested resultCount', () => {
    const payload = buildFinalResultPayload({ resultCount: 3 });
    expect(FinalGameResultSchema.safeParse(payload).success).toBe(false);
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

describe('ResultCountSchema', () => {
  it('accepts 1 through 10 and defaults to 10', () => {
    const parseOptional = (value?: number): number => ResultCountSchema.parse(value);

    expect(ResultCountSchema.parse(1)).toBe(1);
    expect(ResultCountSchema.parse(10)).toBe(10);
    expect(parseOptional()).toBe(10);
  });

  it('rejects 0 and 11', () => {
    expect(ResultCountSchema.safeParse(0).success).toBe(false);
    expect(ResultCountSchema.safeParse(11).success).toBe(false);
  });
});

describe('ApiErrorResponseSchema', () => {
  it('accepts a valid error envelope and rejects unsafe extras', () => {
    expect(
      ApiErrorResponseSchema.safeParse({
        statusCode: 422,
        errorCode: 'FILE_INVALID',
        message: 'The uploaded file could not be processed.',
        messageKey: 'errors.upload.fileInvalid',
      }).success,
    ).toBe(true);

    expect(
      ApiErrorResponseSchema.safeParse({
        statusCode: 422,
        errorCode: 'FILE_INVALID',
        message: 'The uploaded file could not be processed.',
        messageKey: 'errors.upload.fileInvalid',
        stack: 'at foo',
      }).success,
    ).toBe(false);
  });
});

describe('TraitExtractionResponseSchema traitCount derivation', () => {
  it('accepts when traitCount matches the populated field count', () => {
    expect(TraitExtractionResponseSchema.safeParse(buildExtraction()).success).toBe(true);
  });

  it('overwrites a disagreeing traitCount with the authoritative populated count', () => {
    const extraction = buildExtraction();
    extraction['traitCount'] = TOTAL_TRAIT_FIELDS - 1;
    const parsed = TraitExtractionResponseSchema.safeParse(extraction);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.traitCount).toBe(TOTAL_TRAIT_FIELDS);
  });

  it('does not count localized unclear markers as observed traits', () => {
    const extraction = buildExtraction();
    const traits = extraction['traits'] as Record<string, Record<string, string>>;
    const hair = traits['hair'];
    const eyes = traits['eyes'];
    if (hair === undefined || eyes === undefined) {
      throw new Error('Expected hair and eyes fixture categories');
    }
    hair['hairColor'] = 'unclear due to lighting';
    eyes['visibleEyeColor'] = 'غير واضح بسبب الإضاءة';

    const parsed = TraitExtractionResponseSchema.parse(extraction);
    expect(parsed.traitCount).toBe(TOTAL_TRAIT_FIELDS - 2);
  });

  it('rejects an unknown image-quality level instead of silently upgrading it', () => {
    const extraction = buildExtraction();
    extraction['imageQualityCaps'] = [{ quality: 'excellent', impact: 'unknown' }];

    expect(TraitExtractionResponseSchema.safeParse(extraction).success).toBe(false);
  });
});
