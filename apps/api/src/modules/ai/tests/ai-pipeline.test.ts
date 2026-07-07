import { describe, expect, it } from 'vitest';

import { TRAIT_CATEGORY_FIELDS } from '@twinzy/shared';

import {
  AppError,
  ERROR_MESSAGE_KEY_BY_CODE,
  ErrorCode,
  IntegrationError,
} from '../../../core/errors';
import {
  buildCandidatePayload,
  buildCandidatesJson,
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
import { TraitExtractionService } from '../application/trait-extraction.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';

interface Pipeline {
  adapter: FakeAiAdapter;
  traitExtraction: TraitExtractionService;
  candidateGeneration: CandidateGenerationService;
  candidateJudge: CandidateJudgeService;
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
  };
};

const extraction = buildTraitExtraction();

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

    const result = await traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg', 'en');

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

    await traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg', 'en');

    expect(adapter.imageCalls[0]?.prompt).not.toContain('[LANGUAGE_CODE]');
  });

  it('lists every taxonomy field in the prompt template (schema/prompt lock-step)', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse(buildTraitExtractionJson());

    await traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg', 'en');

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

    await expectRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg', 'en'),
      ErrorCode.AiResponseInvalid,
    );
  });

  it('rejects a response missing a category field', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      traits: Record<string, Record<string, string>>;
    };
    delete payload.traits['hair']?.['hairColor'];
    adapter.queueImageResponse(JSON.stringify(payload));

    await expectRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg', 'en'),
      ErrorCode.AiResponseInvalid,
    );
  });

  it('rejects a response with an extra smuggled field', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      traits: Record<string, Record<string, string>>;
    };
    const hair = payload.traits['hair'];
    if (hair !== undefined) {
      hair['smuggledField'] = 'extra';
    }
    adapter.queueImageResponse(JSON.stringify(payload));

    await expectRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg', 'en'),
      ErrorCode.AiResponseInvalid,
    );
  });

  it('rejects a response localized to the wrong language', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse(buildTraitExtractionJson({ languageCode: 'ar' }));

    await expectRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg', 'en'),
      ErrorCode.AiResponseInvalid,
    );
  });

  it('rejects a trait response containing forbidden wording', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      traits: Record<string, Record<string, string>>;
    };
    const overallFace = payload.traits['overallFace'];
    if (overallFace !== undefined) {
      overallFace['overallFaceShape'] = 'looks exactly like a famous actor';
    }
    adapter.queueImageResponse(JSON.stringify(payload));

    await expectRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg', 'en'),
      ErrorCode.AiResponseUnsafe,
    );
  });

  it('rejects a response whose self-reported safety check flags a violation', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      safetyCheck: Record<string, boolean>;
    };
    payload.safetyCheck['containsIdentityClaim'] = true;
    adapter.queueImageResponse(JSON.stringify(payload));

    await expectRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg', 'en'),
      ErrorCode.AiResponseInvalid,
    );
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

    await expectRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg', 'en'),
      ErrorCode.AiTimeout,
    );
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

    const candidates = await candidateGeneration.generateCandidates(extraction, 'en');

    expect(candidates.map((candidate) => candidate.name)).toEqual(['Higher', 'Lower']);
    expect(adapter.imageCalls).toHaveLength(0);
    expect(adapter.textCalls).toHaveLength(1);
  });

  it('embeds the written traits + summary into the prompt text, never the image', async () => {
    const { adapter, candidateGeneration } = buildPipeline();
    adapter.queueTextResponse(buildCandidatesJson());

    await candidateGeneration.generateCandidates(extraction, 'en');

    expect(adapter.textCalls[0]).toContain('observed hairColor');
    expect(adapter.textCalls[0]).toContain('compactTraitSummary');
    expect(adapter.textCalls[0]).not.toContain('base64');
    expect(adapter.textCalls[0]).not.toContain('[LANGUAGE_CODE]');
  });

  it('rejects more than 5 candidates (strict schema, documented)', async () => {
    const { adapter, candidateGeneration } = buildPipeline();
    adapter.queueTextResponse(
      buildCandidatesJson(
        Array.from({ length: 6 }, (_unused, index) =>
          buildCandidatePayload({ name: `Candidate ${index}` }),
        ),
      ),
    );

    await expectRejection(
      candidateGeneration.generateCandidates(extraction, 'en'),
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

    const candidates = await candidateGeneration.generateCandidates(extraction, 'en');

    expect(candidates.map((candidate) => candidate.name)).toEqual(['Safe Star']);
  });
});

describe('CandidateJudgeService (text only)', () => {
  it('judges candidates without ever sending an image', async () => {
    const { adapter, candidateJudge } = buildPipeline();
    adapter.queueTextResponse(buildJudgeJson());

    const response = await candidateJudge.judgeCandidates(extraction.traits, [], 'en');

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

    const response = await candidateJudge.judgeCandidates(extraction.traits, [], 'en');

    expect(response.results.map((result) => result.name)).toEqual(['Safe Star']);
  });

  it('rejects an invalid judge response shape', async () => {
    const { adapter, candidateJudge } = buildPipeline();
    adapter.queueTextResponse(JSON.stringify({ results: 'not-an-array' }));

    await expectRejection(
      candidateJudge.judgeCandidates(extraction.traits, [], 'en'),
      ErrorCode.AiResponseInvalid,
    );
  });
});
