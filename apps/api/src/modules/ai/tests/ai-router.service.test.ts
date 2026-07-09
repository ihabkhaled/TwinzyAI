import { describe, expect, it, vi } from 'vitest';

import type { AiRouteEntry } from '../../../config/ai-route.types';
import {
  AppError,
  ERROR_MESSAGE_KEY_BY_CODE,
  ErrorCode,
  IntegrationError,
  TooManyRequestsError,
} from '../../../core/errors';
import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';
import { AiRouterService } from '../adapters/ai-router.service';
import type { AiShadowService } from '../adapters/ai-shadow.service';
import type { ProviderRegistryService } from '../adapters/provider-registry.service';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';

const unavailable = (): IntegrationError =>
  new IntegrationError(
    'down',
    ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.AiProviderUnavailable],
    ErrorCode.AiProviderUnavailable,
  );

const rateLimited = (): TooManyRequestsError =>
  new TooManyRequestsError(
    'busy',
    ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.AiRateLimited],
    ErrorCode.AiRateLimited,
  );

/** Adapter double whose text-stream behavior is scripted per call. */
const buildAdapter = (impl: (models?: readonly string[]) => Promise<string>): AiProviderAdapter =>
  ({
    generateFromTextStream: vi.fn((_prompt: string, options?: { models?: readonly string[] }) =>
      impl(options?.models),
    ),
    generateFromImageStream: vi.fn(
      (_p: string, _i: unknown, options?: { models?: readonly string[] }) => impl(options?.models),
    ),
  }) as unknown as AiProviderAdapter;

interface RouterFixture {
  router: AiRouterService;
  shadowRuns: ReturnType<typeof vi.fn>;
}

const buildRouter = (
  entries: readonly AiRouteEntry[],
  adapters: Partial<Record<string, AiProviderAdapter>>,
): RouterFixture => {
  const registry = {
    usableEntriesFor: vi.fn(() => entries),
    adapterFor: (provider: string) => adapters[provider],
  } as unknown as ProviderRegistryService;
  const shadowRuns = vi.fn();
  const shadow = { maybeRun: shadowRuns } as unknown as AiShadowService;
  return { router: new AiRouterService(registry, shadow, buildAppLoggerStub().logger), shadowRuns };
};

describe('AiRouterService', () => {
  it('serves from the first usable entry, pinning the adapter to that model', async () => {
    const gemini = buildAdapter((models) => Promise.resolve(`ok:${models?.[0]}`));
    const { router, shadowRuns } = buildRouter([{ provider: 'gemini', model: 'model-a' }], {
      gemini,
    });

    await expect(router.generateFromTextStream('p', { step: 'judge' })).resolves.toBe('ok:model-a');
    expect(shadowRuns).toHaveBeenCalledTimes(1);
  });

  it('hops ACROSS providers on a recoverable failure', async () => {
    const gemini = buildAdapter(() => Promise.reject(rateLimited()));
    const qwen = buildAdapter(() => Promise.resolve('qwen-ok'));
    const { router } = buildRouter(
      [
        { provider: 'gemini', model: 'model-a' },
        { provider: 'qwen', model: 'model-b' },
      ],
      { gemini, qwen },
    );

    await expect(router.generateFromTextStream('p', { step: 'translation' })).resolves.toBe(
      'qwen-ok',
    );
  });

  it('surfaces 429 when the exhausted chain saw a rate limit', async () => {
    const gemini = buildAdapter(() => Promise.reject(rateLimited()));
    const openai = buildAdapter(() => Promise.reject(unavailable()));
    const { router } = buildRouter(
      [
        { provider: 'gemini', model: 'a' },
        { provider: 'openai', model: 'b' },
      ],
      { gemini, openai },
    );

    await expect(router.generateFromTextStream('p', { step: 'judge' })).rejects.toMatchObject({
      errorCode: ErrorCode.AiRateLimited,
    });
  });

  it('surfaces 502 when the chain exhausts without any rate limit', async () => {
    const gemini = buildAdapter(() => Promise.reject(unavailable()));
    const { router } = buildRouter([{ provider: 'gemini', model: 'a' }], { gemini });

    await expect(router.generateFromTextStream('p', { step: 'judge' })).rejects.toMatchObject({
      errorCode: ErrorCode.AiProviderUnavailable,
    });
  });

  it('propagates a non-AppError immediately without hopping', async () => {
    const gemini = buildAdapter(() => Promise.reject(new Error('unexpected bug')));
    const qwen = buildAdapter(() => Promise.resolve('never'));
    const { router } = buildRouter(
      [
        { provider: 'gemini', model: 'a' },
        { provider: 'qwen', model: 'b' },
      ],
      { gemini, qwen },
    );

    await expect(router.generateFromTextStream('p', { step: 'judge' })).rejects.toThrow(
      'unexpected bug',
    );
  });

  it('stops immediately when the caller cancelled, even mid-chain', async () => {
    const controller = new AbortController();
    const gemini = buildAdapter(() => {
      controller.abort();
      return Promise.reject(unavailable());
    });
    const qwen = buildAdapter(() => Promise.resolve('never'));
    const { router } = buildRouter(
      [
        { provider: 'gemini', model: 'a' },
        { provider: 'qwen', model: 'b' },
      ],
      { gemini, qwen },
    );

    await expect(
      router.generateFromTextStream('p', { step: 'judge', signal: controller.signal }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('fails with 502 when no entry is usable at all', async () => {
    const { router, shadowRuns } = buildRouter([], {});

    await expect(router.generateFromTextStream('p', { step: 'judge' })).rejects.toMatchObject({
      errorCode: ErrorCode.AiProviderUnavailable,
    });
    expect(shadowRuns).not.toHaveBeenCalled();
  });

  it('skips an entry whose adapter is not registered', async () => {
    const qwen = buildAdapter(() => Promise.resolve('qwen-ok'));
    const { router } = buildRouter(
      [
        { provider: 'openai', model: 'missing-adapter' },
        { provider: 'qwen', model: 'b' },
      ],
      { qwen },
    );

    await expect(router.generateFromTextStream('p', { step: 'judge' })).resolves.toBe('qwen-ok');
  });
});
