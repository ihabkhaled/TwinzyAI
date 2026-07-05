import * as fs from 'node:fs';

import { HttpStatus } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NO_MATCH_FALLBACK_MESSAGE, RESULT_DISCLAIMER } from '@twinzy/shared';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import {
  buildCandidatesJson,
  buildJudgeJson,
  buildTraitExtractionJson,
  FakeAiAdapter,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildJpegBuffer, buildUploadFile } from '../../../tests/fixtures/image-fixtures';
import type { LoggerStub } from '../../../tests/fixtures/stubs';
import { buildConfigStub, buildLoggerStub } from '../../../tests/fixtures/stubs';
import { PromptLoaderService } from '../../ai/prompts/prompt-loader.service';
import { AiSafetyService } from '../../ai/services/ai-safety.service';
import { CandidateGenerationService } from '../../ai/services/candidate-generation.service';
import { CandidateJudgeService } from '../../ai/services/candidate-judge.service';
import { TraitExtractionService } from '../../ai/services/trait-extraction.service';
import type { ClamAvAdapter } from '../../file-security/adapters/clamav.adapter';
import { FileSecurityService } from '../../file-security/services/file-security.service';
import { FileValidationService } from '../../file-security/services/file-validation.service';
import { ImageDecodeValidationService } from '../../file-security/services/image-decode-validation.service';
import { MagicByteValidationService } from '../../file-security/services/magic-byte-validation.service';
import { TemporaryFileCleanupService } from '../../file-security/services/temporary-file-cleanup.service';
import { VirusScanService } from '../../file-security/services/virus-scan.service';
import { ResultAggregationService } from '../../result-aggregation/services/result-aggregation.service';
import { GameManager } from '../managers/game.manager';

vi.mock('node:fs', { spy: true });

interface Harness {
  manager: GameManager;
  adapter: FakeAiAdapter;
  loggerStub: LoggerStub;
}

const buildHarness = (): Harness => {
  const adapter = new FakeAiAdapter();
  const loggerStub = buildLoggerStub();
  const { logger } = loggerStub;
  const config = buildConfigStub();
  const promptLoader = new PromptLoaderService(config, logger);
  const safety = new AiSafetyService(logger);
  const clamAv = { scanBuffer: vi.fn().mockResolvedValue({ clean: true }) } as unknown as ClamAvAdapter;

  const manager = new GameManager(
    new FileSecurityService(
      new FileValidationService(config),
      new MagicByteValidationService(),
      new ImageDecodeValidationService(),
      new VirusScanService(config, clamAv, logger),
      logger,
    ),
    new TemporaryFileCleanupService(logger),
    new TraitExtractionService(adapter, promptLoader, safety, logger),
    new CandidateGenerationService(adapter, promptLoader, safety, logger),
    new CandidateJudgeService(adapter, promptLoader, safety, logger),
    new ResultAggregationService(logger),
    logger,
  );

  return { manager, adapter, loggerStub };
};

const queueHappyPath = (adapter: FakeAiAdapter): void => {
  adapter.queueImageResponse(buildTraitExtractionJson());
  adapter.queueTextResponse(buildCandidatesJson());
  adapter.queueTextResponse(buildJudgeJson());
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GameManager.analyze', () => {
  it('runs the full pipeline and returns a final result with the disclaimer', async () => {
    const { manager, adapter } = buildHarness();
    queueHappyPath(adapter);

    const result = await manager.analyze(buildUploadFile(), { consent: 'true' });

    expect(result.results).toHaveLength(1);
    expect(result.disclaimer).toBe(RESULT_DISCLAIMER);
    expect(adapter.imageCalls).toHaveLength(1);
    expect(adapter.textCalls).toHaveLength(2);
  });

  it('destroys the image buffer after a successful run', async () => {
    const { manager, adapter } = buildHarness();
    queueHappyPath(adapter);
    const file = buildUploadFile();

    await manager.analyze(file, { consent: 'true' });

    expect(file.buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('destroys the image buffer when the pipeline fails', async () => {
    const { manager, adapter } = buildHarness();
    adapter.queueImageResponse(new Error('provider exploded'));
    const file = buildUploadFile();

    await expect(manager.analyze(file, { consent: 'true' })).rejects.toBeInstanceOf(Error);

    expect(file.buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('never sends the image to the candidate or judge steps', async () => {
    const { manager, adapter } = buildHarness();
    queueHappyPath(adapter);
    const file = buildUploadFile();
    const base64Marker = buildJpegBuffer().toString('base64').slice(0, 24);

    await manager.analyze(file, { consent: 'true' });

    expect(adapter.imageCalls).toHaveLength(1);
    for (const textPrompt of adapter.textCalls) {
      expect(textPrompt).not.toContain(base64Marker);
    }
  });

  it('never writes the image to disk', async () => {
    const { manager, adapter } = buildHarness();
    queueHappyPath(adapter);

    await manager.analyze(buildUploadFile(), { consent: 'true' });

    expect(vi.mocked(fs.writeFileSync)).not.toHaveBeenCalled();
    expect(vi.mocked(fs.createWriteStream)).not.toHaveBeenCalled();
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('never logs image bytes', async () => {
    const { manager, adapter, loggerStub } = buildHarness();
    queueHappyPath(adapter);
    const file = buildUploadFile();
    const base64Marker = file.buffer.toString('base64').slice(0, 24);

    await manager.analyze(file, { consent: 'true' });

    for (const message of loggerStub.messages()) {
      expect(message).not.toContain(base64Marker);
    }
  });

  it('rejects without consent before any AI call', async () => {
    const { manager, adapter } = buildHarness();

    let caught: unknown;
    try {
      await manager.analyze(buildUploadFile(), {});
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainException);
    expect((caught as DomainException).errorCode).toBe(ErrorCode.ConsentRequired);
    expect(adapter.imageCalls).toHaveLength(0);
  });

  it('returns the fallback result when all candidates are filtered as unsafe', async () => {
    const { manager, adapter } = buildHarness();
    adapter.queueImageResponse(buildTraitExtractionJson());
    adapter.queueTextResponse(
      buildCandidatesJson([
        {
          name: 'Unsafe Only',
          publicCategory: 'actor',
          countryOrRegion: 'Global',
          styleVibeFitScore: 90,
          reason: 'Same face, biometric twin.',
          alignedTraits: [],
          weakOrUncertainTraits: [],
          safetyCheck: {
            containsFaceRecognitionClaim: false,
            containsBiometricClaim: false,
            containsIdentityClaim: false,
            containsExactLookalikeClaim: false,
          },
        },
      ]),
    );

    const result = await manager.analyze(buildUploadFile(), { consent: 'true' });

    expect(result.results).toHaveLength(0);
    expect(result.fallbackMessage).toBe(NO_MATCH_FALLBACK_MESSAGE);
    expect(adapter.textCalls).toHaveLength(1);
  });

  it('propagates safe domain errors from the provider without raw details', async () => {
    const { manager, adapter } = buildHarness();
    adapter.queueImageResponse(
      new DomainException(
        ErrorCode.AiProviderUnavailable,
        'The vibe engine is unavailable right now. Please try again in a moment.',
        HttpStatus.BAD_GATEWAY,
      ),
    );

    let caught: unknown;
    try {
      await manager.analyze(buildUploadFile(), { consent: 'true' });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainException);
    expect((caught as DomainException).message).not.toContain('API key');
    expect((caught as DomainException).message).not.toContain('stack');
  });
});
