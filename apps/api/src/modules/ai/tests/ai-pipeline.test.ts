import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { Traits } from '@twinzy/shared';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import {
  buildCandidatePayload,
  buildCandidatesJson,
  buildJudgedResultPayload,
  buildJudgeJson,
  buildTraitExtractionJson,
  buildTraitsPayload,
  FakeAiAdapter,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildJpegBuffer } from '../../../tests/fixtures/image-fixtures';
import { buildConfigStub, buildLoggerStub } from '../../../tests/fixtures/stubs';
import { PromptLoaderService } from '../prompts/prompt-loader.service';
import { AiSafetyService } from '../services/ai-safety.service';
import { CandidateGenerationService } from '../services/candidate-generation.service';
import { CandidateJudgeService } from '../services/candidate-judge.service';
import { TraitExtractionService } from '../services/trait-extraction.service';

interface Pipeline {
  adapter: FakeAiAdapter;
  traitExtraction: TraitExtractionService;
  candidateGeneration: CandidateGenerationService;
  candidateJudge: CandidateJudgeService;
}

const buildPipeline = (): Pipeline => {
  const adapter = new FakeAiAdapter();
  const { logger } = buildLoggerStub();
  const promptLoader = new PromptLoaderService(buildConfigStub(), logger);
  const safety = new AiSafetyService(logger);

  return {
    adapter,
    traitExtraction: new TraitExtractionService(adapter, promptLoader, safety, logger),
    candidateGeneration: new CandidateGenerationService(adapter, promptLoader, safety, logger),
    candidateJudge: new CandidateJudgeService(adapter, promptLoader, safety, logger),
  };
};

const traits = buildTraitsPayload() as Traits;

const expectDomainRejection = async (
  action: Promise<unknown>,
  errorCode: string,
): Promise<void> => {
  let caught: unknown;
  try {
    await action;
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(DomainException);
  expect((caught as DomainException).errorCode).toBe(errorCode);
};

describe('TraitExtractionService', () => {
  it('extracts exactly 15 traits from a valid response and sends the image once', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse(buildTraitExtractionJson());

    const result = await traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg');

    expect(Object.keys(result)).toHaveLength(15);
    expect(adapter.imageCalls).toHaveLength(1);
    expect(adapter.textCalls).toHaveLength(0);
  });

  it('rejects invalid JSON from the provider', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse('this is not json at all');

    await expectDomainRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg'),
      ErrorCode.AiResponseInvalid,
    );
  });

  it('rejects a response missing a trait (14 traits)', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      traits: Record<string, string>;
    };
    delete payload.traits['faceShape'];
    adapter.queueImageResponse(JSON.stringify(payload));

    await expectDomainRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg'),
      ErrorCode.AiResponseInvalid,
    );
  });

  it('rejects a response with an extra 16th trait field', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      traits: Record<string, string>;
    };
    payload.traits['smuggledField'] = 'extra';
    adapter.queueImageResponse(JSON.stringify(payload));

    await expectDomainRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg'),
      ErrorCode.AiResponseInvalid,
    );
  });

  it('rejects a trait response containing forbidden wording', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    const payload = JSON.parse(buildTraitExtractionJson()) as {
      traits: Record<string, string>;
    };
    payload.traits['faceShape'] = 'looks exactly like a famous actor';
    adapter.queueImageResponse(JSON.stringify(payload));

    await expectDomainRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg'),
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

    await expectDomainRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg'),
      ErrorCode.AiResponseInvalid,
    );
  });

  it('propagates a provider timeout as AI_TIMEOUT', async () => {
    const { adapter, traitExtraction } = buildPipeline();
    adapter.queueImageResponse(
      new DomainException(ErrorCode.AiTimeout, 'timeout', HttpStatus.GATEWAY_TIMEOUT),
    );

    await expectDomainRejection(
      traitExtraction.extractTraits(buildJpegBuffer(), 'image/jpeg'),
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

    const candidates = await candidateGeneration.generateCandidates(traits);

    expect(candidates.map((candidate) => candidate.name)).toEqual(['Higher', 'Lower']);
    expect(adapter.imageCalls).toHaveLength(0);
    expect(adapter.textCalls).toHaveLength(1);
  });

  it('embeds the written traits into the prompt text', async () => {
    const { adapter, candidateGeneration } = buildPipeline();
    adapter.queueTextResponse(buildCandidatesJson());

    await candidateGeneration.generateCandidates(traits);

    expect(adapter.textCalls[0]).toContain('observed faceShape');
    expect(adapter.textCalls[0]).not.toContain('base64');
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

    await expectDomainRejection(
      candidateGeneration.generateCandidates(traits),
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

    const candidates = await candidateGeneration.generateCandidates(traits);

    expect(candidates.map((candidate) => candidate.name)).toEqual(['Safe Star']);
  });
});

describe('CandidateJudgeService (text only)', () => {
  it('judges candidates without ever sending an image', async () => {
    const { adapter, candidateJudge } = buildPipeline();
    adapter.queueTextResponse(buildJudgeJson());

    const response = await candidateJudge.judgeCandidates(traits, []);

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
          reason: 'You are definitely this person — same face.',
        }),
      ]),
    );

    const response = await candidateJudge.judgeCandidates(traits, []);

    expect(response.results.map((result) => result.name)).toEqual(['Safe Star']);
  });

  it('rejects an invalid judge response shape', async () => {
    const { adapter, candidateJudge } = buildPipeline();
    adapter.queueTextResponse(JSON.stringify({ results: 'not-an-array' }));

    await expectDomainRejection(
      candidateJudge.judgeCandidates(traits, []),
      ErrorCode.AiResponseInvalid,
    );
  });
});
