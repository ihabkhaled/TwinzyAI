import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';

import type { Candidate, CandidateJudgeResponse, FinalGameResult } from '@twinzy/shared';
import { DEFAULT_RESULT_COUNT } from '@twinzy/shared';

import { buildTraitExtraction } from '../../../tests/fixtures/fake-ai-adapter';
import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';
import type { CandidateJudgeService, CandidateRecallService } from '../../ai';
import type { ResultAggregationService } from '../../result-aggregation';
import { StyleMatchService } from '../application/style-match.service';

const candidate = { name: 'Sample Star', styleVibeFitScore: 80 } as unknown as Candidate;
const judgeResponse = { languageCode: 'en', results: [] } as unknown as CandidateJudgeResponse;
const finalResult = {
  results: [],
  resultCount: DEFAULT_RESULT_COUNT,
} as unknown as FinalGameResult;
const fallbackResult = { results: [], fallbackMessage: 'none' } as unknown as FinalGameResult;

interface StyleMatchHarness {
  service: StyleMatchService;
  recall: { recall: Mock };
  judge: { judgeCandidates: Mock };
  aggregation: { aggregate: Mock; buildFallback: Mock };
}

const buildStyleMatch = (candidates: Candidate[] = [candidate]): StyleMatchHarness => {
  const recall = { recall: vi.fn(() => Promise.resolve(candidates)) };
  const judge = { judgeCandidates: vi.fn(() => Promise.resolve(judgeResponse)) };
  const aggregation = {
    aggregate: vi.fn(() => finalResult),
    buildFallback: vi.fn(() => fallbackResult),
  };
  const { logger } = buildAppLoggerStub();
  const service = new StyleMatchService(
    recall as unknown as CandidateRecallService,
    judge as unknown as CandidateJudgeService,
    aggregation as unknown as ResultAggregationService,
    logger,
  );
  return { service, recall, judge, aggregation };
};

const input = {
  extraction: buildTraitExtraction(),
  languageCode: 'en',
  resultCount: DEFAULT_RESULT_COUNT,
} as const;

describe('StyleMatchService', () => {
  it('recalls, judges, and aggregates when candidates survive', async () => {
    const { service, recall, judge, aggregation } = buildStyleMatch();

    const result = await service.matchFromTraits(input);

    expect(recall.recall).toHaveBeenCalledTimes(1);
    expect(judge.judgeCandidates).toHaveBeenCalledTimes(1);
    expect(aggregation.aggregate).toHaveBeenCalledTimes(1);
    expect(result).toBe(finalResult);
  });

  it('falls back without judging when no candidates survive', async () => {
    const { service, judge, aggregation } = buildStyleMatch([]);

    const result = await service.matchFromTraits(input);

    expect(judge.judgeCandidates).not.toHaveBeenCalled();
    expect(aggregation.buildFallback).toHaveBeenCalledTimes(1);
    expect(result).toBe(fallbackResult);
  });
});
