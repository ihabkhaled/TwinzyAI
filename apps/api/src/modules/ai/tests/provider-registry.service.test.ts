import type { ModuleRef } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import type { AppConfigService } from '../../../config/app-config.service';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import type { GeminiAdapter } from '../adapters/gemini.adapter';
import { ProviderRegistryService } from '../adapters/provider-registry.service';

const geminiAdapter = {} as GeminiAdapter;

const moduleRef = {
  resolve: () => Promise.resolve(buildAppLoggerStub().logger),
} as unknown as ModuleRef;

const buildRegistry = (config: AppConfigService): ProviderRegistryService =>
  new ProviderRegistryService(geminiAdapter, config, moduleRef, buildAppLoggerStub().logger);

describe('ProviderRegistryService', () => {
  it('registers gemini always, compat providers only when enabled', async () => {
    const registry = buildRegistry(buildConfigStub({ enabledProviders: ['gemini', 'deepseek'] }));
    await registry.onModuleInit();

    expect(registry.adapterFor('gemini')).toBe(geminiAdapter);
    expect(registry.adapterFor('deepseek')).toBeDefined();
    expect(registry.adapterFor('openai')).toBeUndefined();
  });

  it('filters usable entries by enablement and, for image calls, vision capability', async () => {
    const registry = buildRegistry(
      buildConfigStub({
        enabledProviders: ['gemini', 'qwen'],
        visionCapableKeys: ['qwen:qwen3-vl-plus'],
        aiStepRoutes: {
          judge: [
            { provider: 'gemini', model: 'g-model' },
            { provider: 'qwen', model: 'qwen3-vl-plus' },
            { provider: 'qwen', model: 'qwen-flash' },
            { provider: 'openai', model: 'gpt-x' },
          ],
        },
      }),
    );
    await registry.onModuleInit();

    // Image call: openai disabled out, qwen-flash vision-filtered out.
    expect(registry.usableEntriesFor('judge', true)).toEqual([
      { provider: 'gemini', model: 'g-model' },
      { provider: 'qwen', model: 'qwen3-vl-plus' },
    ]);
    // Text call: vision filter not applied.
    expect(registry.usableEntriesFor('judge', false)).toEqual([
      { provider: 'gemini', model: 'g-model' },
      { provider: 'qwen', model: 'qwen3-vl-plus' },
      { provider: 'qwen', model: 'qwen-flash' },
    ]);
  });

  it('boot fails fast when an EXPLICIT route keeps zero usable entries', async () => {
    const registry = buildRegistry(
      buildConfigStub({
        enabledProviders: ['gemini'],
        // Explicit judge route pointing only at a disabled provider.
        aiStepRoutes: { judge: [{ provider: 'openai', model: 'gpt-x' }] },
      }),
    );

    await expect(registry.onModuleInit()).rejects.toThrow(/AI_ROUTE_JUDGE/);
  });

  it('boots with a warning (not a crash) when the implicit legacy route is unusable', async () => {
    // No providers enabled at all — the CI / keyless-dev boot scenario.
    const registry = buildRegistry(buildConfigStub({ enabledProviders: [] }));

    await expect(registry.onModuleInit()).resolves.toBeUndefined();
  });

  it('an image-only capability gap on an explicit image-step route fails the boot', async () => {
    const registry = buildRegistry(
      buildConfigStub({
        enabledProviders: ['gemini', 'kimi'],
        // Explicit extraction route with an enabled but NOT vision-declared entry.
        aiStepRoutes: { extraction: [{ provider: 'kimi', model: 'kimi-k2.5' }] },
      }),
    );

    await expect(registry.onModuleInit()).rejects.toThrow(/AI_ROUTE_EXTRACTION/);
  });
});
