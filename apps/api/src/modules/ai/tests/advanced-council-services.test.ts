import { describe, expect, it, vi } from 'vitest';

import type {
  Candidate,
  CandidateJudgeResponse,
  QualitativeMatchingProfile,
  TraitExtractionResponse,
} from '@twinzy/shared';
import {
  CandidateJudgeResponseSchema,
  MatchingSignalConfidence,
  MatchingSignalVisibility,
} from '@twinzy/shared';

import type { AdvancedMatchingConfig } from '../../../config/advanced-matching-config.types';
import { AiProvider } from '../../../config/ai-provider.constants';
import {
  buildCandidatePayload,
  buildJudgeJson,
  buildTraitExtraction,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import type { PublicFigureRetrievalService } from '../../public-figures';
import { AdvancedCandidateCouncilService } from '../application/advanced-candidate-council.service';
import { AdvancedJudgeCouncilService } from '../application/advanced-judge-council.service';
import type { ConsensusFinalizerService } from '../application/consensus-finalizer.service';
import { ConsensusScoringService } from '../application/consensus-scoring.service';
import type { CrossCritiqueService } from '../application/cross-critique.service';
import { CrossCritiqueService as RealCrossCritiqueService } from '../application/cross-critique.service';
import type { MultiModelCouncilService } from '../application/multi-model-council.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import type { JudgeCandidatesInput } from '../model/judge-input.types';
import type { MultiModelCouncilResult } from '../model/multi-model-council.types';

const participant = {
  provider: AiProvider.Gemini,
  model: 'configured-model',
};

const matchingProfile: QualitativeMatchingProfile = {
  stableVisibleStructure: [
    {
      id: 'stable-1',
      value: 'soft oval',
      confidence: MatchingSignalConfidence.High,
      weight: 8,
      visibility: MatchingSignalVisibility.Visible,
      affectedBy: [],
    },
  ],
  mutableStyleSignals: [],
  expressionAndPresentation: [],
  occludedOrUncertainSignals: [],
  contradictionsToAvoid: [],
  accessoryAgnosticSignals: [],
  imageQualityCaps: [],
};

const extraction: TraitExtractionResponse = {
  ...buildTraitExtraction(),
  matchingProfile,
};

const candidate = {
  ...buildCandidatePayload(),
  entityId: 'Q170515',
} as unknown as Candidate;

const councilResult: readonly MultiModelCouncilResult[] = [
  { participantId: 'gemini:configured-model', text: '{}' },
];

const advancedConfig = (
  overrides: Partial<AdvancedMatchingConfig> = {},
): AdvancedMatchingConfig => ({
  ...buildConfigStub().advancedMatching,
  ...overrides,
});

describe('AdvancedCandidateCouncilService', () => {
  const retrievalResult = {
    entityId: 'Q170515',
    profile: {},
    laneIds: ['structure-first'],
    retrievalScore: 80,
    stableEvidenceCoverage: 80,
    mutableEvidenceCoverage: 0,
    contradictionCount: 0,
    sourceConfidence: 100,
  };

  const buildService = (
    overrides: Partial<AdvancedMatchingConfig> = {},
  ): {
    service: AdvancedCandidateCouncilService;
    retrieval: PublicFigureRetrievalService;
    council: MultiModelCouncilService;
  } => {
    const retrieval = {
      retrieve: vi.fn().mockReturnValue([retrievalResult]),
    } as unknown as PublicFigureRetrievalService;
    const council = {
      runTextCouncil: vi.fn().mockResolvedValue(councilResult),
    } as unknown as MultiModelCouncilService;
    const service = new AdvancedCandidateCouncilService(
      buildConfigStub({ advancedMatching: advancedConfig(overrides) }),
      retrieval,
      council,
    );
    return { service, retrieval, council };
  };

  it('keeps legacy candidates when catalog matching is disabled or unavailable', () => {
    const disabled = buildService().service;
    const noProfile = { ...extraction, matchingProfile: undefined };

    expect(disabled.catalog(extraction, 'en')).toBeUndefined();
    expect(buildService({ catalogEnabled: true }).service.catalog(noProfile, 'en')).toBeUndefined();
    expect(disabled.filterToCatalog([candidate], extraction, 'en')).toEqual([candidate]);
  });

  it('retrieves and filters candidates to verified entity ids', () => {
    const { service, retrieval } = buildService({
      catalogEnabled: true,
      maxCombinedCandidates: 12,
    });
    const unresolved = { ...candidate, entityId: undefined };
    const wrong = { ...candidate, entityId: 'Q999' };

    expect(service.catalog(extraction, 'en')).toEqual([retrievalResult]);
    expect(service.filterToCatalog([candidate, unresolved, wrong], extraction, 'en')).toEqual([
      {
        ...candidate,
        retrievalScore: 80,
        retrievalLaneIds: ['structure-first'],
        stableEvidenceCoverage: 80,
      },
    ]);
    expect(retrieval.retrieve).toHaveBeenCalledWith(matchingProfile, 'en', 12);
    expect(service.combinedCandidateLimit).toBe(12);
  });

  it('runs only a fully configured ensemble with the same prompt', async () => {
    expect(buildService().service.run('prompt')).toBeUndefined();
    expect(
      buildService({
        ensembleEnabled: true,
        generationParticipants: [],
      }).service.run('prompt'),
    ).toBeUndefined();
    const { service, council } = buildService({
      ensembleEnabled: true,
      generationParticipants: [participant],
      minSuccessfulParticipants: 1,
      stepTimeoutMs: 1234,
    });

    await expect(service.run('same prompt')).resolves.toEqual(councilResult);
    expect(council.runTextCouncil).toHaveBeenCalledWith({
      prompt: 'same prompt',
      participants: [participant],
      minimumSuccessfulParticipants: 1,
      timeoutMs: 1234,
    });
  });
});

describe('AdvancedJudgeCouncilService', () => {
  const input = {
    extraction,
    candidates: [candidate],
    languageCode: 'en',
    resultCount: 1,
  } as JudgeCandidatesInput;
  const judged = CandidateJudgeResponseSchema.parse(JSON.parse(buildJudgeJson()));

  it('runs configured judge participants and always delegates structured critique', async () => {
    const council = {
      runTextCouncil: vi.fn().mockResolvedValue(councilResult),
    } as unknown as MultiModelCouncilService;
    const critique = {
      critique: vi.fn().mockResolvedValue([]),
    } as unknown as CrossCritiqueService;
    const finalizer = {
      finalize: vi.fn().mockResolvedValue(judged),
    } as unknown as ConsensusFinalizerService;
    const enabled = new AdvancedJudgeCouncilService(
      buildConfigStub({
        advancedMatching: advancedConfig({
          ensembleEnabled: true,
          judgeParticipants: [participant],
          minSuccessfulParticipants: 1,
        }),
      }),
      council,
      critique,
      finalizer,
      new ConsensusScoringService(),
    );

    await expect(enabled.run('prompt')).resolves.toEqual(councilResult);
    await expect(enabled.critique(input, [judged])).resolves.toEqual([]);
    expect(critique.critique).toHaveBeenCalledWith({
      extraction,
      candidates: [candidate],
      judgeResponses: [judged],
      languageCode: 'en',
    });
    await expect(enabled.finalize(input, judged)).resolves.toBe(judged);
    expect(enabled.score(input, [judged], judged)).toBe(judged);
  });

  it('does not run an absent or disabled judge ensemble', () => {
    const council = {} as MultiModelCouncilService;
    const critique = {} as CrossCritiqueService;
    const finalizer = {} as ConsensusFinalizerService;

    expect(
      new AdvancedJudgeCouncilService(
        buildConfigStub(),
        council,
        critique,
        finalizer,
        new ConsensusScoringService(),
      ).run('prompt'),
    ).toBeUndefined();
    expect(
      new AdvancedJudgeCouncilService(
        buildConfigStub({
          advancedMatching: advancedConfig({
            ensembleEnabled: true,
            judgeParticipants: [],
          }),
        }),
        council,
        critique,
        finalizer,
        new ConsensusScoringService(),
      ).run('prompt'),
    ).toBeUndefined();
  });
});

describe('CrossCritiqueService', () => {
  const judged: CandidateJudgeResponse = CandidateJudgeResponseSchema.parse(
    JSON.parse(buildJudgeJson()),
  );

  const buildService = (
    overrides: Partial<AdvancedMatchingConfig>,
  ): {
    service: RealCrossCritiqueService;
    council: MultiModelCouncilService;
  } => {
    const config = buildConfigStub({
      advancedMatching: advancedConfig(overrides),
    });
    const { logger } = buildAppLoggerStub();
    const promptTemplate = new PromptTemplateRepository(config, logger);
    const council = {
      runTextCouncil: vi.fn().mockResolvedValue([
        {
          participantId: 'gemini:configured-model',
          text: JSON.stringify({
            reviewerParticipantId: 'gemini:configured-model',
            critiques: [],
            missingCoverage: [],
            requiresSecondRetrievalPass: true,
            suggestedSearchTags: ['soft oval'],
          }),
        },
      ]),
    } as unknown as MultiModelCouncilService;
    return {
      service: new RealCrossCritiqueService(promptTemplate, council, config),
      council,
    };
  };

  it('skips critique unless both the flag and participants are present', async () => {
    await expect(
      buildService({ crossCritiqueEnabled: false }).service.critique({
        extraction,
        candidates: [candidate],
        judgeResponses: [judged],
        languageCode: 'en',
      }),
    ).resolves.toEqual([]);
    await expect(
      buildService({
        crossCritiqueEnabled: true,
        critiqueParticipants: [],
      }).service.critique({
        extraction,
        candidates: [candidate],
        judgeResponses: [judged],
        languageCode: 'en',
      }),
    ).resolves.toEqual([]);
  });

  it('builds one text-only evidence prompt and validates every critique', async () => {
    const { service, council } = buildService({
      crossCritiqueEnabled: true,
      critiqueParticipants: [participant],
      minSuccessfulParticipants: 1,
    });

    const result = await service.critique({
      extraction,
      candidates: [candidate],
      judgeResponses: [judged],
      languageCode: 'en',
    });

    expect(result[0]?.suggestedSearchTags).toEqual(['soft oval']);
    expect(council.runTextCouncil).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: [participant],
        minimumSuccessfulParticipants: 1,
      }),
    );
    const prompt = vi.mocked(council.runTextCouncil).mock.calls[0]?.[0].prompt;
    expect(prompt).toContain('soft oval');
    expect(prompt).not.toContain('[TRAITS_JSON]');
  });
});
