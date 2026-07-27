import { describe, expect, it } from 'vitest';

import type { CandidateJudgeResponse, JudgedResult } from '@twinzy/shared';

import { buildJudgedResultPayload } from '../../../tests/fixtures/fake-ai-adapter';
import { mergeCouncilJudgeResponses } from '../lib/judge-council-merge.util';

const judged = (entityId: string | undefined, score: number, shouldDisplay = true): JudgedResult =>
  ({
    ...buildJudgedResultPayload({
      entityId,
      finalStyleVibeFitScore: score,
      shouldDisplay,
    }),
  }) as unknown as JudgedResult;

const response = (
  results: readonly JudgedResult[],
  removedCandidates: CandidateJudgeResponse['removedCandidates'] = [],
): CandidateJudgeResponse => ({
  promptVersion: 'written-traits-v6',
  languageCode: 'en',
  resultCount: results.length,
  results: [...results],
  removedCandidates,
  fallbackMessage: '',
  disclaimer: 'Entertainment only.',
});

describe('mergeCouncilJudgeResponses', () => {
  it('rejects an empty council and preserves a single response', () => {
    expect(() => mergeCouncilJudgeResponses([])).toThrow('Judge council returned no responses');
    const only = response([judged('Q1', 40)]);
    expect(mergeCouncilJudgeResponses([only])).toBe(only);
  });

  it('uses median scores, majority visibility, entity ids, and sorted output', () => {
    const responses = [
      response([judged('Q1', 20), judged('Q2', 70), judged(undefined, 100)]),
      response([judged('Q1', 30, false), judged('Q2', 80)]),
      response([judged('Q1', 100, false), judged('Q2', 90)]),
    ];

    const merged = mergeCouncilJudgeResponses(responses);

    expect(merged.results.map((result) => result.entityId)).toEqual(['Q2', 'Q1']);
    expect(merged.results[0]?.finalStyleVibeFitScore).toBe(80);
    expect(merged.results[1]).toMatchObject({
      finalStyleVibeFitScore: 30,
      shouldDisplay: false,
    });
  });

  it('rounds an even median and combines removed candidates', () => {
    const removed = {
      name: 'Removed',
      reasonRemoved: 'Insufficient evidence.',
    };
    const merged = mergeCouncilJudgeResponses([
      response([judged('Q1', 20)], [removed]),
      response([judged('Q1', 31)], [removed]),
    ]);

    expect(merged.results[0]?.finalStyleVibeFitScore).toBe(26);
    expect(merged.removedCandidates).toEqual([removed, removed]);
  });
});
