import { describe, expect, it } from 'vitest';

import type { CandidateJudgeResponse } from '@twinzy/shared';
import {
  DEFAULT_RESULT_COUNT,
  NO_MATCH_FALLBACK_BY_LANGUAGE,
  NO_MATCH_FALLBACK_MESSAGE,
  RESULT_DISCLAIMER,
  RESULT_DISCLAIMER_BY_LANGUAGE,
} from '@twinzy/shared';

import {
  buildJudgedResultPayload,
  buildTraitExtraction,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';
import { ResultAggregationService } from '../application/result-aggregation.service';

const extraction = buildTraitExtraction();

const buildService = (): ResultAggregationService =>
  new ResultAggregationService(buildAppLoggerStub().logger);

const CAP_RESULT_COUNT = 5;

const buildJudgeResponse = (results: Record<string, unknown>[]): CandidateJudgeResponse =>
  ({
    results,
    removedCandidates: [],
    fallbackMessage: '',
    disclaimer: 'model-provided disclaimer that must be ignored',
  }) as unknown as CandidateJudgeResponse;

describe('ResultAggregationService', () => {
  it('caps final results at 5 and re-ranks by score', () => {
    const response = buildJudgeResponse(
      [95, 91, 88, 85, 82, 78].map((score, index) =>
        buildJudgedResultPayload({
          name: `Star ${score}`,
          rank: index + 1,
          finalStyleVibeFitScore: score,
        }),
      ),
    );

    const result = buildService().aggregate(extraction, response, 'en', CAP_RESULT_COUNT);

    expect(result.results).toHaveLength(5);
    expect(result.results.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(result.results[0]?.name).toBe('Star 95');
    expect(result.results.some((item) => item.name === 'Star 78')).toBe(false);
  });

  it('removes weak verdicts, low scores, and non-displayable results', () => {
    const response = buildJudgeResponse([
      buildJudgedResultPayload({ name: 'Keeper', finalStyleVibeFitScore: 85 }),
      buildJudgedResultPayload({ name: 'Weak', verdict: 'weak', rank: 2 }),
      buildJudgedResultPayload({ name: 'LowScore', finalStyleVibeFitScore: 60, rank: 3 }),
      buildJudgedResultPayload({ name: 'Hidden', shouldDisplay: false, rank: 4 }),
    ]);

    const result = buildService().aggregate(extraction, response, 'en', DEFAULT_RESULT_COUNT);

    expect(result.results.map((item) => item.name)).toEqual(['Keeper']);
  });

  it('returns the localized fallback message when nothing survives filtering', () => {
    const response = buildJudgeResponse([
      buildJudgedResultPayload({ name: 'Weak', verdict: 'weak' }),
    ]);

    const result = buildService().aggregate(extraction, response, 'en', DEFAULT_RESULT_COUNT);

    expect(result.results).toHaveLength(0);
    expect(result.fallbackMessage).toBe(NO_MATCH_FALLBACK_MESSAGE);
    expect(result.disclaimer).toBe(RESULT_DISCLAIMER);
  });

  it('always enforces the fixed server-side disclaimer in the requested language', () => {
    const response = buildJudgeResponse([buildJudgedResultPayload()]);

    const english = buildService().aggregate(extraction, response, 'en', DEFAULT_RESULT_COUNT);
    expect(english.disclaimer).toBe(RESULT_DISCLAIMER);
    expect(english.disclaimer).not.toContain('model-provided');
    expect(english.languageCode).toBe('en');

    const responseAr = buildJudgeResponse([buildJudgedResultPayload()]);
    const arabic = buildService().aggregate(extraction, responseAr, 'ar', DEFAULT_RESULT_COUNT);
    expect(arabic.disclaimer).toBe(RESULT_DISCLAIMER_BY_LANGUAGE.ar);
    expect(arabic.languageCode).toBe('ar');
  });

  it('carries the advanced trait payload, summary, and count into the response', () => {
    const response = buildJudgeResponse([buildJudgedResultPayload()]);

    const result = buildService().aggregate(extraction, response, 'en', DEFAULT_RESULT_COUNT);

    expect(result.traits).toEqual(extraction.traits);
    expect(result.compactTraitSummary).toEqual(extraction.compactTraitSummary);
    expect(result.traitCount).toBe(extraction.traitCount);
  });

  it('never exposes the judge removedCandidates list on the public payload', () => {
    const response = {
      ...buildJudgeResponse([buildJudgedResultPayload()]),
      removedCandidates: [{ name: 'Removed Star', reasonRemoved: 'unsafe wording' }],
    } as CandidateJudgeResponse;

    const result = buildService().aggregate(extraction, response, 'en', DEFAULT_RESULT_COUNT);

    expect(JSON.stringify(result)).not.toContain('Removed Star');
  });

  it('builds a localized fallback result with traits and disclaimer', () => {
    const result = buildService().buildFallback(extraction, 'ar', DEFAULT_RESULT_COUNT);

    expect(result.traits).toEqual(extraction.traits);
    expect(result.results).toHaveLength(0);
    expect(result.fallbackMessage).toBe(NO_MATCH_FALLBACK_BY_LANGUAGE.ar);
    expect(result.disclaimer).toBe(RESULT_DISCLAIMER_BY_LANGUAGE.ar);
  });
});
