import { describe, expect, it, vi } from 'vitest';

import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { AiShadowService } from '../adapters/ai-shadow.service';
import type { ProviderRegistryService } from '../adapters/provider-registry.service';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';

const shadowAdapter = {} as AiProviderAdapter;

const registry = {
  adapterFor: () => shadowAdapter,
} as unknown as ProviderRegistryService;

const flushBackground = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('AiShadowService', () => {
  it('does nothing when shadow mode is disabled', () => {
    const execute = vi.fn();
    const service = new AiShadowService(
      buildConfigStub({
        shadowEnabled: false,
        shadowStepRoutes: { judge: { provider: 'openai', model: 'gpt-x' } },
      }),
      registry,
      buildAppLoggerStub().logger,
    );

    service.maybeRun('judge', execute);
    expect(execute).not.toHaveBeenCalled();
  });

  it('runs the shadow entry for a sampled-in text call without touching the caller', async () => {
    let dispatchedModels: readonly string[] | undefined;
    const execute = vi.fn((_adapter: unknown, models: readonly string[]) => {
      dispatchedModels = models;
      return Promise.resolve('{"ok":true}');
    });
    const service = new AiShadowService(
      buildConfigStub({
        shadowEnabled: true,
        shadowSampleRate: 1,
        enabledProviders: ['gemini', 'openai'],
        shadowStepRoutes: { judge: { provider: 'openai', model: 'gpt-x' } },
      }),
      registry,
      buildAppLoggerStub().logger,
    );

    // maybeRun is fire-and-forget: it returns void immediately.
    service.maybeRun('judge', execute);
    await flushBackground();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(dispatchedModels).toEqual(['gpt-x']);
  });

  it('swallows shadow failures silently', async () => {
    const execute = vi.fn(() => Promise.reject(new Error('shadow blew up')));
    const service = new AiShadowService(
      buildConfigStub({
        shadowEnabled: true,
        shadowSampleRate: 1,
        enabledProviders: ['gemini', 'openai'],
        shadowStepRoutes: { judge: { provider: 'openai', model: 'gpt-x' } },
      }),
      registry,
      buildAppLoggerStub().logger,
    );

    service.maybeRun('judge', execute);
    await flushBackground();
    expect(execute).toHaveBeenCalledTimes(1);
    // Reaching here without an unhandled rejection IS the assertion.
  });

  it('samples out at rate 0 even when fully configured', async () => {
    const execute = vi.fn();
    const service = new AiShadowService(
      buildConfigStub({
        shadowEnabled: true,
        shadowSampleRate: 0,
        enabledProviders: ['gemini', 'openai'],
        shadowStepRoutes: { judge: { provider: 'openai', model: 'gpt-x' } },
      }),
      registry,
      buildAppLoggerStub().logger,
    );

    service.maybeRun('judge', execute);
    await flushBackground();
    expect(execute).not.toHaveBeenCalled();
  });
});
