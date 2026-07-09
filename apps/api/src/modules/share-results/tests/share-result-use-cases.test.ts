import { describe, expect, it, vi } from 'vitest';

import type { FinalGameResult } from '@twinzy/shared';
import { buildSharePagePath, FinalGameResultSchema, ShareIdSchema } from '@twinzy/shared';

import type { AppConfigService } from '../../../config';
import { AppError } from '../../../core/errors';
import { buildFinalGameResultPayload } from '../../../tests/fixtures/fake-ai-adapter';
import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';
import { CreateShareResultUseCase } from '../application/create-share-result.use-case';
import { DeleteShareResultUseCase } from '../application/delete-share-result.use-case';
import { GetShareResultUseCase } from '../application/get-share-result.use-case';
import type { ShareResultCacheService } from '../application/share-result-cache.service';
import type { ShareResultSafetyService } from '../application/share-result-safety.service';
import type { StoredShareRecord } from '../model/share-result.types';

const buildResult = (): FinalGameResult =>
  FinalGameResultSchema.parse(buildFinalGameResultPayload());

const buildConfig = (overrides: Partial<AppConfigService>): AppConfigService =>
  overrides as unknown as AppConfigService;

interface CreateSetup {
  useCase: CreateShareResultUseCase;
  store: ReturnType<typeof vi.fn>;
  safety: {
    assertWithinPayloadBudget: ReturnType<typeof vi.fn>;
    assertSafeToShare: ReturnType<typeof vi.fn>;
  };
}

const setupCreate = (ttlSeconds = 600): CreateSetup => {
  const store = vi.fn(() => Promise.resolve());
  const safety = {
    assertWithinPayloadBudget: vi.fn(),
    assertSafeToShare: vi.fn(),
  };
  const useCase = new CreateShareResultUseCase(
    safety as unknown as ShareResultSafetyService,
    { store } as unknown as ShareResultCacheService,
    buildConfig({
      shareResultTtlSeconds: ttlSeconds,
      shareResultPublicBaseUrl: 'https://twinzy.app',
    }),
    buildAppLoggerStub().logger,
  );
  return { useCase, store, safety };
};

const buildStoredRecord = (): StoredShareRecord => ({
  shareId: '3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b',
  languageCode: 'en',
  result: buildResult(),
  createdAtMs: Date.now(),
  expiresAtMs: Date.now() + 300_000,
});

describe('CreateShareResultUseCase', () => {
  it('mints a uuid, computes a 10-minute window, and returns safe link metadata', async () => {
    const { useCase, store } = setupCreate();

    const response = await useCase.create({ result: buildResult() });

    expect(ShareIdSchema.safeParse(response.shareId).success).toBe(true);
    expect(response.ttlSeconds).toBe(600);
    expect(response.shareUrl).toBe(`https://twinzy.app${buildSharePagePath(response.shareId)}`);
    const elapsed = Date.parse(response.expiresAt) - Date.parse(response.createdAt);
    expect(elapsed).toBe(600_000);
    expect(store).toHaveBeenCalledTimes(1);
  });

  it('caches ONLY the safe result (languageCode from result, no image field)', async () => {
    const { useCase, store } = setupCreate();

    await useCase.create({ result: buildResult() });

    const record = store.mock.calls[0]?.[0] as StoredShareRecord;
    expect(record.languageCode).toBe('en');
    expect(record.result).toEqual(buildResult());
    // No image BYTES anywhere (trait field *names* like imageQuality are fine).
    expect(JSON.stringify(record)).not.toMatch(/data:image|;base64,/iu);
    expect(record).not.toHaveProperty('image');
  });

  it('runs the safety gates before caching', async () => {
    const { useCase, safety } = setupCreate();

    await useCase.create({ result: buildResult() });

    expect(safety.assertWithinPayloadBudget).toHaveBeenCalledTimes(1);
    expect(safety.assertSafeToShare).toHaveBeenCalledTimes(1);
  });

  it('honors a non-default configured TTL', async () => {
    const { useCase } = setupCreate(120);

    const response = await useCase.create({ result: buildResult() });

    expect(response.ttlSeconds).toBe(120);
    expect(Date.parse(response.expiresAt) - Date.parse(response.createdAt)).toBe(120_000);
  });
});

describe('GetShareResultUseCase', () => {
  it('returns the active record with server-computed remainingSeconds', async () => {
    const record = buildStoredRecord();
    const useCase = new GetShareResultUseCase({
      find: vi.fn().mockResolvedValue(record),
    } as unknown as ShareResultCacheService);

    const response = await useCase.get(record.shareId);

    expect(response.shareId).toBe(record.shareId);
    expect(response.result).toEqual(record.result);
    expect(response.remainingSeconds).toBeGreaterThan(0);
    expect(response.remainingSeconds).toBeLessThanOrEqual(300);
  });

  it('throws a not-found error when the record is missing or expired', async () => {
    const useCase = new GetShareResultUseCase({
      find: vi.fn(() => Promise.resolve()),
    } as unknown as ShareResultCacheService);

    await expect(useCase.get('3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b')).rejects.toBeInstanceOf(
      AppError,
    );
  });
});

describe('DeleteShareResultUseCase', () => {
  it('delegates removal to the cache', async () => {
    const remove = vi.fn(() => Promise.resolve());
    const useCase = new DeleteShareResultUseCase({ remove } as unknown as ShareResultCacheService);

    await useCase.delete('3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b');
    expect(remove).toHaveBeenCalledWith('3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b');
  });
});
