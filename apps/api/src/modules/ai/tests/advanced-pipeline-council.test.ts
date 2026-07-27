import { describe, expect, it, vi } from 'vitest';

import type { Candidate, CandidateJudgeResponse, ModelCrossCritique } from '@twinzy/shared';

import {
  buildCandidatePayload,
  buildCandidatesJson,
  buildJudgedResultPayload,
  buildJudgeJson,
  buildTraitExtraction,
  FakeAiAdapter,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import type { AdvancedCandidateCouncilService } from '../application/advanced-candidate-council.service';
import type { AdvancedJudgeCouncilService } from '../application/advanced-judge-council.service';
import { AiSafetyService } from '../application/ai-safety.service';
import { CandidateGenerationService } from '../application/candidate-generation.service';
import { CandidateJudgeService } from '../application/candidate-judge.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';

const candidate = (
  entityId: string,
  score: number,
  name = 'Sample Star',
): Record<string, unknown> =>
  buildCandidatePayload({
    entityId,
    name,
    styleVibeFitScore: score,
    supportedSignalIds: ['stable-1'],
    contradictedSignalIds: [],
  });

const judged = (entityId: string, score: number): Record<string, unknown> =>
  buildJudgedResultPayload({
    entityId,
    finalStyleVibeFitScore: score,
  });

const buildDependencies = (): {
  adapter: FakeAiAdapter;
  promptTemplate: PromptTemplateRepository;
  safety: AiSafetyService;
  logger: ReturnType<typeof buildAppLoggerStub>['logger'];
} => {
  const config = buildConfigStub();
  const { logger } = buildAppLoggerStub();
  return {
    adapter: new FakeAiAdapter(),
    promptTemplate: new PromptTemplateRepository(config, logger),
    safety: new AiSafetyService(logger),
    logger,
  };
};

describe('advanced candidate and judge pipeline councils', () => {
  it('merges catalog-bounded generator responses without using the primary adapter', async () => {
    const dependencies = buildDependencies();
    const advanced = {
      catalog: vi.fn().mockReturnValue([
        { entityId: 'Q1', retrievalScore: 80 },
        { entityId: 'Q2', retrievalScore: 70 },
      ]),
      run: vi.fn().mockReturnValue(
        Promise.resolve([
          {
            participantId: 'gemini:one',
            text: buildCandidatesJson([candidate('Q1', 20)]),
          },
          {
            participantId: 'openai:two',
            text: buildCandidatesJson([candidate('Q1', 40), candidate('Q2', 60, 'Second Star')]),
          },
        ]),
      ),
      filterToCatalog: vi.fn((values: readonly Candidate[]) => [...values]),
      combinedCandidateLimit: 10,
    } as unknown as AdvancedCandidateCouncilService;
    const service = new CandidateGenerationService(
      dependencies.adapter,
      dependencies.promptTemplate,
      dependencies.safety,
      dependencies.logger,
      advanced,
    );

    const results = await service.generateCandidates(buildTraitExtraction(), 'en', 2);

    expect(results.map((result) => result.entityId)).toEqual(['Q2', 'Q1']);
    expect(results[1]?.styleVibeFitScore).toBe(30);
    expect(dependencies.adapter.textCalls).toHaveLength(0);
    expect(advanced.filterToCatalog).toHaveBeenCalled();
    expect(advanced.catalog).toHaveBeenCalled();
  });

  it('merges judge medians and exposes only bounded critique retry guidance', async () => {
    const dependencies = buildDependencies();
    const critique: ModelCrossCritique = {
      reviewerParticipantId: 'deepseek:three',
      critiques: [],
      missingCoverage: [],
      requiresSecondRetrievalPass: true,
      suggestedSearchTags: ['soft oval', 'balanced proportions'],
    };
    const duplicateTagCritique: ModelCrossCritique = {
      ...critique,
      reviewerParticipantId: 'gemini:one',
      suggestedSearchTags: ['soft oval'],
    };
    const advanced = {
      run: vi.fn().mockReturnValue(
        Promise.resolve([
          {
            participantId: 'gemini:one',
            text: buildJudgeJson([judged('Q1', 20)]),
          },
          {
            participantId: 'openai:two',
            text: buildJudgeJson([judged('Q1', 30)]),
          },
          {
            participantId: 'deepseek:three',
            text: buildJudgeJson([judged('Q1', 100)]),
          },
        ]),
      ),
      critique: vi.fn().mockResolvedValue([critique, duplicateTagCritique]),
      finalize: vi.fn(
        (_input: unknown, authoritative: CandidateJudgeResponse): Promise<CandidateJudgeResponse> =>
          Promise.resolve(authoritative),
      ),
      score: vi.fn(
        (
          _input: unknown,
          _responses: readonly CandidateJudgeResponse[],
          merged: CandidateJudgeResponse,
        ): CandidateJudgeResponse => merged,
      ),
    } as unknown as AdvancedJudgeCouncilService;
    const service = new CandidateJudgeService(
      dependencies.adapter,
      dependencies.promptTemplate,
      dependencies.safety,
      dependencies.logger,
      advanced,
    );
    const inputCandidate = candidate('Q1', 50) as unknown as Candidate;

    const result = await service.judgeCandidates({
      extraction: buildTraitExtraction(),
      candidates: [inputCandidate],
      languageCode: 'en',
      resultCount: 1,
    });

    expect(result.results[0]?.finalStyleVibeFitScore).toBe(30);
    expect(result.requiresSecondRetrievalPass).toBe(true);
    expect(result.suggestedSearchTags).toEqual(['soft oval', 'balanced proportions']);
    expect(dependencies.adapter.textCalls).toHaveLength(0);
  });

  it('does not add retry fields when critiques do not request another pass', async () => {
    const dependencies = buildDependencies();
    const response = buildJudgeJson([judged('Q1', 40)]);
    const advanced = {
      run: vi
        .fn()
        .mockReturnValue(Promise.resolve([{ participantId: 'gemini:one', text: response }])),
      critique: vi.fn().mockResolvedValue([
        {
          reviewerParticipantId: 'gemini:one',
          critiques: [],
          missingCoverage: [],
          requiresSecondRetrievalPass: false,
          suggestedSearchTags: [],
        },
      ]),
      finalize: vi.fn(
        (_input: unknown, authoritative: CandidateJudgeResponse): Promise<CandidateJudgeResponse> =>
          Promise.resolve(authoritative),
      ),
      score: vi.fn(
        (
          _input: unknown,
          _responses: readonly CandidateJudgeResponse[],
          merged: CandidateJudgeResponse,
        ): CandidateJudgeResponse => merged,
      ),
    } as unknown as AdvancedJudgeCouncilService;
    const service = new CandidateJudgeService(
      dependencies.adapter,
      dependencies.promptTemplate,
      dependencies.safety,
      dependencies.logger,
      advanced,
    );

    const result: CandidateJudgeResponse = await service.judgeCandidates({
      extraction: buildTraitExtraction(),
      candidates: [candidate('Q1', 40) as unknown as Candidate],
      languageCode: 'en',
      resultCount: 1,
    });

    expect(result.requiresSecondRetrievalPass).toBeUndefined();
    expect(result.suggestedSearchTags).toBeUndefined();
  });
});
