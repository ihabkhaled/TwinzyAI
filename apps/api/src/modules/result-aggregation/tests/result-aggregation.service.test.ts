import { describe, expect, it } from 'vitest';

import type { CandidateJudgeResponse, Traits } from '@twinzy/shared';
import { NO_MATCH_FALLBACK_MESSAGE, RESULT_DISCLAIMER } from '@twinzy/shared';

import {
  buildJudgedResultPayload,
  buildTraitsPayload,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';
import { ResultAggregationService } from '../application/result-aggregation.service';

const traits = buildTraitsPayload() as Traits;

const buildService = (): ResultAggregationService =>
  new ResultAggregationService(buildAppLoggerStub().logger);

const buildJudgeResponse = (results: Record<string, unknown>[]): CandidateJudgeResponse =>
  ({
    results,
    fallbackMessage: '',
    disclaimer: 'model-provided disclaimer that must be ignored',
  }) as unknown as CandidateJudgeResponse;

describe('ResultAggregationService', () => {
  it('caps final results at 4 and re-ranks by score', () => {
    const response = buildJudgeResponse(
      [95, 91, 88, 82, 78].map((score, index) =>
        buildJudgedResultPayload({
          name: `Star ${score}`,
          rank: index + 1,
          finalStyleVibeFitScore: score,
        }),
      ),
    );

    const result = buildService().aggregate(traits, response);

    expect(result.results).toHaveLength(4);
    expect(result.results.map((item) => item.rank)).toEqual([1, 2, 3, 4]);
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

    const result = buildService().aggregate(traits, response);

    expect(result.results.map((item) => item.name)).toEqual(['Keeper']);
  });

  it('returns the fallback message when nothing survives filtering', () => {
    const response = buildJudgeResponse([
      buildJudgedResultPayload({ name: 'Weak', verdict: 'weak' }),
    ]);

    const result = buildService().aggregate(traits, response);

    expect(result.results).toHaveLength(0);
    expect(result.fallbackMessage).toBe(NO_MATCH_FALLBACK_MESSAGE);
    expect(result.disclaimer).toBe(RESULT_DISCLAIMER);
  });

  it('always enforces the fixed server-side disclaimer', () => {
    const response = buildJudgeResponse([buildJudgedResultPayload()]);

    const result = buildService().aggregate(traits, response);

    expect(result.disclaimer).toBe(RESULT_DISCLAIMER);
    expect(result.disclaimer).not.toContain('model-provided');
  });

  it('builds a fallback result with traits and disclaimer', () => {
    const result = buildService().buildFallback(traits);

    expect(result.traits).toEqual(traits);
    expect(result.results).toHaveLength(0);
    expect(result.fallbackMessage).toBe(NO_MATCH_FALLBACK_MESSAGE);
    expect(result.disclaimer).toBe(RESULT_DISCLAIMER);
  });
});
