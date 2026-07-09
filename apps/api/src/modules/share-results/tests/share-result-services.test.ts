import { describe, expect, it, vi } from 'vitest';

import type { FinalGameResult } from '@twinzy/shared';
import { FinalGameResultSchema } from '@twinzy/shared';

import type { AppConfigService } from '../../../config';
import { AppError } from '../../../core/errors';
import { buildFinalGameResultPayload } from '../../../tests/fixtures/fake-ai-adapter';
import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';
import { ShareResultCacheService } from '../application/share-result-cache.service';
import { ShareResultSafetyService } from '../application/share-result-safety.service';
import type { ShareResultCachePort } from '../model/share-result.port';
import type { StoredShareRecord } from '../model/share-result.types';

const buildResult = (overrides: Record<string, unknown> = {}): FinalGameResult =>
  FinalGameResultSchema.parse(buildFinalGameResultPayload(overrides));

const buildConfig = (overrides: Partial<AppConfigService>): AppConfigService =>
  overrides as unknown as AppConfigService;

const buildRecord = (shareId: string): StoredShareRecord => ({
  shareId,
  languageCode: 'en',
  result: buildResult(),
  createdAtMs: Date.now(),
  expiresAtMs: Date.now() + 60_000,
});

const buildPort = (size: number): { port: ShareResultCachePort; set: ReturnType<typeof vi.fn> } => {
  const set = vi.fn(() => Promise.resolve());
  const port = {
    set,
    get: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    size: vi.fn().mockResolvedValue(size),
  } as unknown as ShareResultCachePort;
  return { port, set };
};

const buildSafety = (maxBytes: number): ShareResultSafetyService =>
  new ShareResultSafetyService(
    buildConfig({ shareResultMaxPayloadBytes: maxBytes }),
    buildAppLoggerStub().logger,
  );

describe('ShareResultCacheService', () => {
  it('stores a record while under the active-items cap', async () => {
    const { port, set } = buildPort(0);
    const service = new ShareResultCacheService(
      port,
      buildConfig({ shareResultMaxActiveItems: 2 }),
    );

    await service.store(buildRecord('a'));
    expect(set).toHaveBeenCalledTimes(1);
  });

  it('rejects a new record once the active-items cap is reached', async () => {
    const { port, set } = buildPort(2);
    const service = new ShareResultCacheService(
      port,
      buildConfig({ shareResultMaxActiveItems: 2 }),
    );

    await expect(service.store(buildRecord('a'))).rejects.toBeInstanceOf(AppError);
    expect(set).not.toHaveBeenCalled();
  });
});

describe('ShareResultSafetyService', () => {
  it('accepts a normal result within budget and free of forbidden content', () => {
    const service = buildSafety(50_000);
    expect(() => {
      service.assertWithinPayloadBudget(buildResult());
    }).not.toThrow();
    expect(() => {
      service.assertSafeToShare(buildResult());
    }).not.toThrow();
  });

  it('rejects an over-budget payload', () => {
    const service = buildSafety(500);
    expect(() => {
      service.assertWithinPayloadBudget(buildResult());
    }).toThrow(AppError);
  });

  it('rejects a result with forbidden wording anywhere in it', () => {
    const service = buildSafety(50_000);
    const unsafe = buildResult({ fallbackMessage: 'we identified the person is you' });
    expect(() => {
      service.assertSafeToShare(unsafe);
    }).toThrow(AppError);
  });

  it('rejects a result with an embedded data: image URL smuggled into a field', () => {
    const service = buildSafety(50_000);
    const unsafe = buildResult({ disclaimer: 'safe text data:image/png;base64,AAAA more' });
    expect(() => {
      service.assertSafeToShare(unsafe);
    }).toThrow(AppError);
  });
});
