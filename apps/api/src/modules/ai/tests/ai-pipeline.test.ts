import { describe, expect, it } from 'vitest';

import { DEFAULT_RESULT_COUNT, FinalGameResultSchema, TRAIT_CATEGORY_FIELDS } from '@twinzy/shared';

import {
  AppError,
  ERROR_MESSAGE_KEY_BY_CODE,
  ErrorCode,
  IntegrationError,
} from '../../../core/errors';
import {
  buildCandidatePayload,
  buildCandidatesJson,
  buildFinalGameResultPayload,
  buildJudgedResultPayload,
  buildJudgeJson,
  buildTraitExtraction,
  buildTraitExtractionJson,
  FakeAiAdapter,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildJpegBuffer } from '../../../tests/fixtures/image-fixtures';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { AiSafetyService } from '../application/ai-safety.service';
import { CandidateGenerationService } from '../application/candidate-generation.service';
import { CandidateJudgeService } from '../application/candidate-judge.service';
import { ResultTranslationService } from '../application/result-translation.service';
import { TraitExtractionService } from '../application/trait-extraction.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { buildAiImageInput } from '../lib/image-input.util';

interface Pipeline {
  adapter: FakeAiAdapter;
  traitExtraction: TraitExtractionService;
  candidateGeneration: CandidateGenerationService;
  candidateJudge: CandidateJudgeService;
  resultTranslation: ResultTranslationService;
}

const buildPipeline = (): Pipeline => {
  const adapter = new FakeAiAdapter();
  const { logger } = buildAppLoggerStub();
  const promptTemplate = new PromptTemplateRepository(buildConfigStub(), logger);
  const safety = new AiSafetyService(logger);

  return {
    adapter,
    traitExtraction: new TraitExtractionService(adapter, promptTemplate, safety, logger),
    candidateGeneration: new CandidateGenerationService(adapter, promptTemplate, safety, logger),
    candidateJudge: new CandidateJudgeService(adapter, promptTemplate, safety, logger),
    resultTranslation: new ResultTranslationService(adapter, promptTemplate, safety, logger),
  };
};

const extraction = buildTraitExtraction();

const image = buildAiImageInput({ buffer: buildJpegBuffer(), mimetype: 'image/jpeg' });

const expectRejection = async (action: Promise<unknown>, errorCode: string): Promise<void> => {
  let caught: unknown;
  try {
    await action;
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(AppError);
  expect((caught as AppError).errorCode).toBe(errorCode);
};

describe('TraitExtractionService', () => {
  it('extracts the full advanced taxonomy from a valid response and sends the image once', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse(buildTraitExtractionJson());

    const result = await traitExtraction.extractTraits(image, 'en');

    // 16 categories + uncertaintyNotes.
    expect(Object.keys(result.traits)).toHaveLength(17);
    expect(result.traitCount).toBeGreaterThanOrEqual(100);
    expect(result.compactTraitSummary.length).toBeGreaterThan(0);
    expect(adapter.imageCalls).toHaveLength(1);
    expect(adapter.textCalls).toHaveLength(0);
  });

  it('replaces the language placeholder in the prompt with the requested code', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse(buildTraitExtractionJson());

    await traitExtraction.extractTraits(image, 'en');

    expect(adapter.imageCalls[0]?.prompt).not.toContain('[LANGUAGE_CODE]');
  });

  it('lists every taxonomy field in the prompt template (schema/prompt lock-step)', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse(buildTraitExtractionJson());

    await traitExtraction.extractTraits(image, 'en');

    const prompt = adapter.imageCalls[0]?.prompt ?? '';
    for (const fields of Object.values(TRAIT_CATEGORY_FIELDS)) {
      for (const field of fields) {
        expect(prompt).toContain(`"${field}"`);
      }
    }
  });

  it('rejects invalid JSON from the provider', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse('this is not json at all');

    await expectRejection(traitExtraction.extractTraits(image, 'en'), ErrorCode.AiResponseInvalid);
  });

  it('rejects a non-object traits payload before count normalization', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse(JSON.stringify({ traits: 'invalid' }));

    await expectRejection(traitExtraction.extractTraits(image, 'en'), ErrorCode.AiResponseInvalid);
  });

  it('tolerates a missing category field by dropping it instead of rejecting', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      traits: Record<string, Record<string, string>>;
    };
    delete payload.traits['hair']?.['hairColor'];
    adapter.queueImageResponse(JSON.stringify(payload));

    const result = await traitExtraction.extractTraits(image, 'en');
    expect((result.traits.hair as Record<string, unknown>)['hairColor']).toBeUndefined();
  });

  it('strips an extra smuggled field instead of rejecting the whole extraction', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      traits: Record<string, Record<string, string>>;
    };
    const hair = payload.traits['hair'];
    if (hair !== undefined) {
      hair['smuggledField'] = 'extra';
    }
    adapter.queueImageResponse(JSON.stringify(payload));

    const result = await traitExtraction.extractTraits(image, 'en');
    expect((result.traits.hair as Record<string, unknown>)['smuggledField']).toBeUndefined();
  });

  it('rejects a response localized to the wrong language', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse(buildTraitExtractionJson({ languageCode: 'ar' }));

    await expectRejection(traitExtraction.extractTraits(image, 'en'), ErrorCode.AiResponseInvalid);
  });

  it('rejects a trait response containing forbidden wording', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      traits: Record<string, Record<string, string>>;
    };
    const overallFace = payload.traits['overallFace'];
    if (overallFace !== undefined) {
      overallFace['overallFaceShape'] = 'we identified this famous actor';
    }
    adapter.queueImageResponse(JSON.stringify(payload));

    await expectRejection(traitExtraction.extractTraits(image, 'en'), ErrorCode.AiResponseUnsafe);
  });

  it('rejects a response whose self-reported safety check flags a violation', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      safetyCheck: Record<string, boolean>;
    };
    payload.safetyCheck['containsIdentityClaim'] = true;
    adapter.queueImageResponse(JSON.stringify(payload));

    await expectRejection(traitExtraction.extractTraits(image, 'en'), ErrorCode.AiResponseInvalid);
  });

  it('propagates a provider timeout as AI_TIMEOUT', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse(
      new IntegrationError(
        'timeout',
        ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.AiTimeout],
        ErrorCode.AiTimeout,
      ),
    );

    await expectRejection(traitExtraction.extractTraits(image, 'en'), ErrorCode.AiTimeout);
  });
});

describe('CandidateGenerationService (text only)', () => {
  it('returns candidates ranked by score and never sends an image', async () => {
    const { adapter, candidateGeneration } = buildPipeline();
    adapter.queueTextResponse(
      buildCandidatesJson([
        buildCandidatePayload({ name: 'Lower', styleVibeFitScore: 71 }),
        buildCandidatePayload({ name: 'Higher', styleVibeFitScore: 90 }),
      ]),
    );

    const candidates = await candidateGeneration.generateCandidates(
      extraction,
      'en',
      DEFAULT_RESULT_COUNT,
    );

    expect(candidates.map((candidate) => candidate.name)).toEqual(['Higher', 'Lower']);
    expect(adapter.imageCalls).toHaveLength(0);
    expect(adapter.textCalls).toHaveLength(1);
  });

  it('embeds the full written matching evidence into the prompt without an image', async () => {
    const { adapter, candidateGeneration } = buildPipeline();
    adapter.queueTextResponse(buildCandidatesJson());

    await candidateGeneration.generateCandidates(extraction, 'en', DEFAULT_RESULT_COUNT);

    const prompt = adapter.textCalls[0] ?? '';
    expect(prompt).toContain('observed hairColor');
    expect(prompt).toContain('compactTraitSummary');
    expect(prompt).toContain('weightedTraitEvidence');
    expect(prompt).toContain('candidateSearchHints');
    expect(prompt).toContain('imageQualityCaps');
    expect(prompt).not.toContain('base64');
    expect(prompt).not.toContain('[LANGUAGE_CODE]');
  });

  it('rejects more than 25 candidates (strict schema, documented)', async () => {
    const { adapter, candidateGeneration } = buildPipeline();
    adapter.queueTextResponse(
      buildCandidatesJson(
        Array.from({ length: 26 }, (_unused, index) =>
          buildCandidatePayload({ name: `Candidate ${index}` }),
        ),
        DEFAULT_RESULT_COUNT,
      ),
    );

    await expectRejection(
      candidateGeneration.generateCandidates(extraction, 'en', DEFAULT_RESULT_COUNT),
      ErrorCode.AiResponseInvalid,
    );
  });

  it('drops candidates that contain unsafe wording', async () => {
    const { adapter, candidateGeneration } = buildPipeline();
    adapter.queueTextResponse(
      buildCandidatesJson([
        buildCandidatePayload({ name: 'Safe Star' }),
        buildCandidatePayload({
          name: 'Unsafe Star',
          reason: 'This is basically face recognition of the person.',
        }),
      ]),
    );

    const candidates = await candidateGeneration.generateCandidates(
      extraction,
      'en',
      DEFAULT_RESULT_COUNT,
    );

    expect(candidates.map((candidate) => candidate.name)).toEqual(['Safe Star']);
  });

  it('rejects candidates returned in the wrong language', async () => {
    const { adapter, candidateGeneration } = buildPipeline();
    const payload = JSON.parse(buildCandidatesJson()) as Record<string, unknown>;
    payload['languageCode'] = 'ar';
    adapter.queueTextResponse(JSON.stringify(payload));

    await expectRejection(
      candidateGeneration.generateCandidates(extraction, 'en', DEFAULT_RESULT_COUNT),
      ErrorCode.AiResponseInvalid,
    );
  });
});

describe('CandidateJudgeService (text only)', () => {
  it('judges candidates without ever sending an image', async () => {
    const { adapter, candidateJudge } = buildPipeline();
    adapter.queueTextResponse(buildJudgeJson());

    const response = await candidateJudge.judgeCandidates({
      extraction,
      candidates: [],
      languageCode: 'en',
      resultCount: DEFAULT_RESULT_COUNT,
    });

    expect(response.results).toHaveLength(1);
    expect(adapter.imageCalls).toHaveLength(0);
    expect(adapter.textCalls).toHaveLength(1);
  });

  it('drops judged results with unsafe wording', async () => {
    const { adapter, candidateJudge } = buildPipeline();
    adapter.queueTextResponse(
      buildJudgeJson([
        buildJudgedResultPayload({ name: 'Safe Star' }),
        buildJudgedResultPayload({
          name: 'Unsafe Star',
          rank: 2,
          finalReason: 'You are definitely this person — same face.',
        }),
      ]),
    );

    const response = await candidateJudge.judgeCandidates({
      extraction,
      candidates: [],
      languageCode: 'en',
      resultCount: DEFAULT_RESULT_COUNT,
    });

    expect(response.results.map((result) => result.name)).toEqual(['Safe Star']);
  });

  it('rejects an invalid judge response shape', async () => {
    const { adapter, candidateJudge } = buildPipeline();
    adapter.queueTextResponse(JSON.stringify({ results: 'not-an-array' }));

    await expectRejection(
      candidateJudge.judgeCandidates({
        extraction,
        candidates: [],
        languageCode: 'en',
        resultCount: DEFAULT_RESULT_COUNT,
      }),
      ErrorCode.AiResponseInvalid,
    );
  });

  it('rejects judge output returned in the wrong language', async () => {
    const { adapter, candidateJudge } = buildPipeline();
    const payload = JSON.parse(buildJudgeJson()) as Record<string, unknown>;
    payload['languageCode'] = 'ar';
    adapter.queueTextResponse(JSON.stringify(payload));

    await expectRejection(
      candidateJudge.judgeCandidates({
        extraction,
        candidates: [],
        languageCode: 'en',
        resultCount: DEFAULT_RESULT_COUNT,
      }),
      ErrorCode.AiResponseInvalid,
    );
  });
});

describe('per-step model chain declaration', () => {
  it('each pipeline service declares its own step so config can route its model chain', async () => {
    const { adapter, traitExtraction, candidateGeneration, candidateJudge } = buildPipeline();
    adapter.queueImageResponse(buildTraitExtractionJson());
    adapter.queueTextResponse(buildCandidatesJson());
    adapter.queueTextResponse(buildJudgeJson());

    await traitExtraction.extractTraits(image, 'en');
    await candidateGeneration.generateCandidates(extraction, 'en', DEFAULT_RESULT_COUNT);
    await candidateJudge.judgeCandidates({
      extraction,
      candidates: [],
      languageCode: 'en',
      resultCount: DEFAULT_RESULT_COUNT,
    });

    expect(adapter.imageCalls.map((call) => call.step)).toEqual(['extraction']);
    expect(adapter.textSteps).toEqual(['generation', 'judge']);
  });
});

describe('ResultTranslationService', () => {
  it('rejects an invalid provider response shape', async () => {
    const { adapter, resultTranslation } = buildPipeline();
    adapter.queueTextResponse('{}');
    const original = FinalGameResultSchema.parse(buildFinalGameResultPayload());

    await expectRejection(
      resultTranslation.translateResult(original, 'ar'),
      ErrorCode.AiResponseInvalid,
    );
  });
});
