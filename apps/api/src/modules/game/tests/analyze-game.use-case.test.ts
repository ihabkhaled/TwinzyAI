import * as fs from 'node:fs';

import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NO_MATCH_FALLBACK_MESSAGE, RESULT_DISCLAIMER } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { AppConfigModule } from '../../../config/config.module';
import {
  ERROR_MESSAGE_KEY_BY_CODE,
  ErrorCode,
  IntegrationError,
  ValidationError,
} from '../../../core/errors';
import { AppLogger, LoggerModule } from '../../../core/logger';
import {
  buildCandidatesJson,
  buildJudgeJson,
  buildTraitExtractionJson,
  FakeAiAdapter,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildJpegBuffer, buildUploadFile } from '../../../tests/fixtures/image-fixtures';
import type { AppLoggerStub } from '../../../tests/fixtures/stubs';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { AI_PROVIDER_ADAPTER, AiModule } from '../../ai';
import { FileSecurityModule } from '../../file-security';
import { PrivacyModule } from '../../privacy';
import { ResultAggregationModule } from '../../result-aggregation';
import { AnalyzeGameUseCase } from '../application/analyze-game.use-case';
import { StyleMatchService } from '../application/style-match.service';

vi.mock('node:fs', { spy: true });

interface Harness {
  useCase: AnalyzeGameUseCase;
  adapter: FakeAiAdapter;
  loggerStub: AppLoggerStub;
}

/**
 * Boots the real pipeline (file-security chain, AI services, aggregation)
 * through the module barrels, swapping only the outermost seams: the AI
 * provider port (deterministic fake), the config (ClamAV disabled), and the
 * logger (captured so image-leak assertions can inspect every line).
 */
const buildHarness = async (): Promise<Harness> => {
  const adapter = new FakeAiAdapter();
  const loggerStub = buildAppLoggerStub();

  const moduleRef = await Test.createTestingModule({
    imports: [
      AppConfigModule,
      LoggerModule,
      PrivacyModule,
      AiModule,
      FileSecurityModule,
      ResultAggregationModule,
    ],
    providers: [AnalyzeGameUseCase, StyleMatchService],
  })
    .overrideProvider(AI_PROVIDER_ADAPTER)
    .useValue(adapter)
    .overrideProvider(AppConfigService)
    .useValue(buildConfigStub())
    .overrideProvider(AppLogger)
    .useValue(loggerStub.logger)
    .compile();

  return { useCase: moduleRef.get(AnalyzeGameUseCase), adapter, loggerStub };
};

const queueHappyPath = (adapter: FakeAiAdapter): void => {
  adapter.queueImageResponse(buildTraitExtractionJson());
  adapter.queueTextResponse(buildCandidatesJson());
  adapter.queueTextResponse(buildJudgeJson());
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AnalyzeGameUseCase.analyze', () => {
  it('runs the full pipeline and returns a final result with the disclaimer', async () => {
    const { useCase, adapter } = await buildHarness();
    queueHappyPath(adapter);

    const result = await useCase.analyze(buildUploadFile(), { consent: 'true' });

    expect(result.results).toHaveLength(1);
    expect(result.disclaimer).toBe(RESULT_DISCLAIMER);
    expect(adapter.imageCalls).toHaveLength(1);
    expect(adapter.textCalls).toHaveLength(2);
  });

  it('destroys the image buffer after a successful run', async () => {
    const { useCase, adapter } = await buildHarness();
    queueHappyPath(adapter);
    const file = buildUploadFile();

    await useCase.analyze(file, { consent: 'true' });

    expect(file.buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('destroys the image buffer when the pipeline fails', async () => {
    const { useCase, adapter } = await buildHarness();
    adapter.queueImageResponse(new Error('provider exploded'));
    const file = buildUploadFile();

    await expect(useCase.analyze(file, { consent: 'true' })).rejects.toBeInstanceOf(Error);

    expect(file.buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('never sends the image to the candidate or judge steps', async () => {
    const { useCase, adapter } = await buildHarness();
    queueHappyPath(adapter);
    const file = buildUploadFile();
    const base64Marker = buildJpegBuffer().toString('base64').slice(0, 24);

    await useCase.analyze(file, { consent: 'true' });

    expect(adapter.imageCalls).toHaveLength(1);
    for (const textPrompt of adapter.textCalls) {
      expect(textPrompt).not.toContain(base64Marker);
    }
  });

  it('never writes the image to disk', async () => {
    const { useCase, adapter } = await buildHarness();
    queueHappyPath(adapter);

    await useCase.analyze(buildUploadFile(), { consent: 'true' });

    expect(vi.mocked(fs.writeFileSync)).not.toHaveBeenCalled();
    expect(vi.mocked(fs.createWriteStream)).not.toHaveBeenCalled();
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('never logs image bytes', async () => {
    const { useCase, adapter, loggerStub } = await buildHarness();
    queueHappyPath(adapter);
    const file = buildUploadFile();
    const base64Marker = file.buffer.toString('base64').slice(0, 24);

    await useCase.analyze(file, { consent: 'true' });

    for (const message of loggerStub.messages()) {
      expect(message).not.toContain(base64Marker);
    }
  });

  it('rejects without consent before any AI call', async () => {
    const { useCase, adapter } = await buildHarness();

    let caught: unknown;
    try {
      await useCase.analyze(buildUploadFile(), {});
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ValidationError);
    expect((caught as ValidationError).errorCode).toBe(ErrorCode.ConsentRequired);
    expect(adapter.imageCalls).toHaveLength(0);
  });

  it('returns the fallback result when all candidates are filtered as unsafe', async () => {
    const { useCase, adapter } = await buildHarness();
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

    const result = await useCase.analyze(buildUploadFile(), { consent: 'true' });

    expect(result.results).toHaveLength(0);
    expect(result.fallbackMessage).toBe(NO_MATCH_FALLBACK_MESSAGE);
    expect(adapter.textCalls).toHaveLength(1);
  });

  it('propagates safe domain errors from the provider without raw details', async () => {
    const { useCase, adapter } = await buildHarness();
    adapter.queueImageResponse(
      new IntegrationError(
        'The vibe engine is unavailable right now. Please try again in a moment.',
        ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.AiProviderUnavailable],
        ErrorCode.AiProviderUnavailable,
      ),
    );

    let caught: unknown;
    try {
      await useCase.analyze(buildUploadFile(), { consent: 'true' });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(IntegrationError);
    expect((caught as IntegrationError).message).not.toContain('API key');
    expect((caught as IntegrationError).message).not.toContain('stack');
  });
});
