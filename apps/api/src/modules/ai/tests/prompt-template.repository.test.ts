import type * as NodeFs from 'node:fs';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_NAME, MODEL_PROVIDER } from '@twinzy/shared';

import { AppError, ErrorCode } from '../../../core/errors';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';

/**
 * The repository reads prompt templates from disk. These tests mock node:fs so
 * every load path — cache hit/miss, missing file, unreadable file, malformed
 * template, and unreplaced placeholder — is exercised deterministically without
 * touching the real filesystem. The remaining fs exports are preserved so the
 * wider import graph (Nest, logger) keeps working. The real prompt files are
 * still exercised through the pipeline services in ai-pipeline.test.ts.
 */
const { existsSyncMock, readFileSyncMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn<(candidate: string) => boolean>(),
  readFileSyncMock: vi.fn<(candidate: string, encoding: string) => string>(),
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof NodeFs>();
  return { ...actual, existsSync: existsSyncMock, readFileSync: readFileSyncMock };
});

const buildRepository = (
  overrides: Partial<{ isProduction: boolean }> = {},
): PromptTemplateRepository => {
  const { logger } = buildAppLoggerStub();
  return new PromptTemplateRepository(buildConfigStub(overrides), logger);
};

const internalErrorCodeOf = (action: () => unknown): string => {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    return (error as AppError).errorCode;
  }
  throw new Error('Expected the build to throw, but it did not.');
};

describe('PromptTemplateRepository', () => {
  beforeEach(() => {
    existsSyncMock.mockReset();
    readFileSyncMock.mockReset();
  });

  it('replaces every placeholder and caches the template across repeat builds', () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(
      `Traits: ${PromptPlaceholder.TraitsJson} for ${PromptPlaceholder.AppName} via ${PromptPlaceholder.ModelProvider}`,
    );
    const repository = buildRepository();

    const first = repository.buildPrompt(PromptKey.CandidateGeneration, {
      [PromptPlaceholder.TraitsJson]: '{"a":1}',
    });
    const second = repository.buildPrompt(PromptKey.CandidateGeneration, {
      [PromptPlaceholder.TraitsJson]: '{"b":2}',
    });

    expect(first).toContain('{"a":1}');
    expect(first).toContain(APP_NAME);
    expect(first).toContain(MODEL_PROVIDER);
    expect(first).not.toContain(PromptPlaceholder.TraitsJson);
    expect(first).not.toContain(PromptPlaceholder.AppName);
    expect(second).toContain('{"b":2}');
    // Second build must not re-read the file: the template is cached.
    expect(readFileSyncMock).toHaveBeenCalledTimes(1);
  });

  it('skips the debug log in production but still builds the prompt', () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(`${PromptPlaceholder.TraitsJson} only`);
    const repository = buildRepository({ isProduction: true });

    const prompt = repository.buildPrompt(PromptKey.CandidateGeneration, {
      [PromptPlaceholder.TraitsJson]: '{"c":3}',
    });

    expect(prompt).toContain('{"c":3}');
    expect(prompt).not.toContain(PromptPlaceholder.TraitsJson);
  });

  it('rejects a build when a required replacement value is missing', () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(`${PromptPlaceholder.TraitsJson} placeholder`);
    const repository = buildRepository();

    const errorCode = internalErrorCodeOf(() =>
      repository.buildPrompt(PromptKey.CandidateGeneration, {}),
    );

    expect(errorCode).toBe(ErrorCode.InternalError);
  });

  it('maps a missing prompt file to a generic internal error', () => {
    existsSyncMock.mockReturnValue(false);
    const repository = buildRepository();

    const errorCode = internalErrorCodeOf(() =>
      repository.buildPrompt(PromptKey.TraitExtraction, {}),
    );

    expect(errorCode).toBe(ErrorCode.InternalError);
    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it('maps an unreadable prompt file to a generic internal error', () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });
    const repository = buildRepository();

    const errorCode = internalErrorCodeOf(() =>
      repository.buildPrompt(PromptKey.TraitExtraction, {}),
    );

    expect(errorCode).toBe(ErrorCode.InternalError);
  });

  it('rejects a template that is missing a required placeholder', () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue('This template has no placeholder at all.');
    const repository = buildRepository();

    const errorCode = internalErrorCodeOf(() =>
      repository.buildPrompt(PromptKey.CandidateGeneration, {
        [PromptPlaceholder.TraitsJson]: '{"d":4}',
      }),
    );

    expect(errorCode).toBe(ErrorCode.InternalError);
  });

  it('rejects a template that still contains a placeholder after replacement', () => {
    existsSyncMock.mockReturnValue(true);
    // CandidateGeneration only requires TraitsJson; the extra CandidatesJson
    // placeholder is never provided, so it survives replacement and must fail.
    readFileSyncMock.mockReturnValue(
      `${PromptPlaceholder.TraitsJson} and ${PromptPlaceholder.CandidatesJson}`,
    );
    const repository = buildRepository();

    const errorCode = internalErrorCodeOf(() =>
      repository.buildPrompt(PromptKey.CandidateGeneration, {
        [PromptPlaceholder.TraitsJson]: '{"e":5}',
      }),
    );

    expect(errorCode).toBe(ErrorCode.InternalError);
  });
});
