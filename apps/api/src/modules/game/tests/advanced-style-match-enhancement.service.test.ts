import { describe, expect, it, vi } from 'vitest';

import type { Candidate, CandidateJudgeResponse } from '@twinzy/shared';
import { CandidateJudgeResponseSchema, FinalGameResultSchema } from '@twinzy/shared';

import {
  buildCandidatePayload,
  buildFinalGameResultPayload,
  buildJudgeJson,
  buildTraitExtraction,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildConfigStub } from '../../../tests/fixtures/stubs';
import type { CandidateJudgeService, CandidateRecallService } from '../../ai';
import type { PublicFigureEnrichmentService } from '../../public-figures';
import { AdvancedStyleMatchEnhancementService } from '../application/advanced-style-match-enhancement.service';
import type { StyleMatchInput } from '../model/game-stream.types';

const candidate = {
  ...buildCandidatePayload(),
  entityId: 'Q170515',
} as unknown as Candidate;

const secondCandidate = {
  ...candidate,
  entityId: 'Q1354960',
  name: 'Second Figure',
} as Candidate;

const judged = (overrides: Record<string, unknown> = {}): CandidateJudgeResponse =>
  CandidateJudgeResponseSchema.parse({
    ...JSON.parse(buildJudgeJson()),
    ...overrides,
  });

const input: StyleMatchInput = {
  extraction: buildTraitExtraction(),
  languageCode: 'en',
  resultCount: 1,
};

const buildFinalResult = (overrides: Record<string, unknown> = {}): Record<string, unknown> => {
  const payload = buildFinalGameResultPayload();
  const results = payload['results'] as Record<string, unknown>[];
  return { ...results[0], ...overrides };
};

const buildService = (
  secondRetrievalPassEnabled: boolean,
): {
  service: AdvancedStyleMatchEnhancementService;
  recall: CandidateRecallService;
  judge: CandidateJudgeService;
  enrichment: PublicFigureEnrichmentService;
} => {
  const recall = {
    recall: vi.fn().mockResolvedValue([secondCandidate]),
  } as unknown as CandidateRecallService;
  const judge = {
    judgeCandidates: vi.fn().mockResolvedValue(judged()),
  } as unknown as CandidateJudgeService;
  const enrichment = {
    enrich: vi.fn().mockResolvedValue(undefined),
  } as unknown as PublicFigureEnrichmentService;
  const config = buildConfigStub({
    advancedMatching: {
      ...buildConfigStub().advancedMatching,
      secondRetrievalPassEnabled,
    },
  });
  return {
    service: new AdvancedStyleMatchEnhancementService(config, recall, judge, enrichment),
    recall,
    judge,
    enrichment,
  };
};

describe('AdvancedStyleMatchEnhancementService', () => {
  it.each([
    ['flag disabled', false, true, ['soft oval']],
    ['critique did not request retry', true, false, ['soft oval']],
    ['critique supplied no tags', true, true, []],
  ])('keeps the authoritative response when %s', async (_label, enabled, requested, tags) => {
    const { service, recall } = buildService(enabled);
    const original = judged({
      requiresSecondRetrievalPass: requested,
      suggestedSearchTags: tags,
    });

    await expect(service.retryIfRequested(input, [candidate], original)).resolves.toBe(original);
    expect(recall.recall).not.toHaveBeenCalled();
  });

  it('does not retry when critique omitted its optional search tags', async () => {
    const { service, recall } = buildService(true);
    const original = judged({ requiresSecondRetrievalPass: true });

    await expect(service.retryIfRequested(input, [candidate], original)).resolves.toBe(original);
    expect(recall.recall).not.toHaveBeenCalled();
  });

  it('performs exactly one bounded text-only retry and re-judges the merged pool', async () => {
    const { service, recall, judge } = buildService(true);
    const original = judged({
      requiresSecondRetrievalPass: true,
      suggestedSearchTags: ['soft oval'],
    });

    await service.retryIfRequested(input, [candidate], original);

    expect(recall.recall).toHaveBeenCalledTimes(1);
    expect(recall.recall).toHaveBeenCalledWith({
      extraction: input.extraction,
      languageCode: 'en',
      resultCount: 1,
      signal: undefined,
      suggestedSearchTags: ['soft oval'],
    });
    expect(judge.judgeCandidates).toHaveBeenCalledWith(
      expect.objectContaining({
        candidates: expect.arrayContaining([candidate, secondCandidate]),
      }),
    );
  });

  it('enriches only resolved final entities and preserves missing metadata', async () => {
    const { service, enrichment } = buildService(false);
    const result = FinalGameResultSchema.parse(
      buildFinalGameResultPayload({
        results: [
          buildFinalResult({ entityId: 'Q170515' }),
          buildFinalResult({ entityId: undefined, rank: 2 }),
        ],
        resultCount: 2,
      }),
    );
    vi.mocked(enrichment.enrich).mockResolvedValueOnce({
      entityId: 'Q170515',
      canonicalName: 'Omar Sharif',
      occupations: ['actor'],
      googleSearchUrl: 'https://www.google.com/search?q=Omar+Sharif',
    });

    const enriched = await service.enrich(result);

    expect(enriched.results[0]?.publicFigure?.canonicalName).toBe('Omar Sharif');
    expect(enriched.results[1]?.publicFigure).toBeUndefined();
    expect(enrichment.enrich).toHaveBeenCalledTimes(1);
  });

  it('leaves a resolved result unchanged when enrichment is unavailable', async () => {
    const { service } = buildService(false);
    const result = FinalGameResultSchema.parse(
      buildFinalGameResultPayload({
        results: [buildFinalResult({ entityId: 'Q170515' })],
      }),
    );

    await expect(service.enrich(result)).resolves.toEqual(result);
  });
});
