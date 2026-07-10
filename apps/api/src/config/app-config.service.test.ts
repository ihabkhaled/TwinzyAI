import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { MAX_AI_ROUTE_ENTRIES } from './ai-route.constants';
import { AppConfigService } from './app-config.service';
import type { ParsedEnv } from './env.schema';
import { GeminiStep } from './gemini-step.constants';

/** Minimal ConfigService stand-in: serves values straight from a record. */
const buildService = (env: Partial<Record<keyof ParsedEnv, string>>): AppConfigService => {
  const configService = {
    get: (key: keyof ParsedEnv): string => env[key] ?? '',
  } as unknown as ConfigService<ParsedEnv, true>;
  return new AppConfigService(configService);
};

const BASE_ENV: Partial<Record<keyof ParsedEnv, string>> = {
  GEMINI_MODEL: 'global-primary',
  GEMINI_FALLBACK_MODELS: 'global-fb-1,global-fb-2',
};

describe('AppConfigService.geminiModelChainFor', () => {
  it('returns the global chain when no step is given', () => {
    const config = buildService(BASE_ENV);
    expect(config.geminiModelChainFor()).toEqual(['global-primary', 'global-fb-1', 'global-fb-2']);
  });

  it('returns the global chain for a step with no per-step configuration', () => {
    const config = buildService(BASE_ENV);
    expect(config.geminiModelChainFor(GeminiStep.Extraction)).toEqual([
      'global-primary',
      'global-fb-1',
      'global-fb-2',
    ]);
  });

  it('returns exactly the per-step chain when the step is configured', () => {
    const config = buildService({
      ...BASE_ENV,
      GEMINI_MODEL_TRANSLATION: 'cheap-fast',
      GEMINI_FALLBACK_MODELS_TRANSLATION: 'cheap-fb-1, cheap-fb-2',
    });
    // Per-step values fully REPLACE the global chain (no merge) so operators
    // can e.g. keep lite models out of the extraction chain entirely.
    expect(config.geminiModelChainFor(GeminiStep.Translation)).toEqual([
      'cheap-fast',
      'cheap-fb-1',
      'cheap-fb-2',
    ]);
  });

  it('supports a per-step chain of fallbacks only (no step primary)', () => {
    const config = buildService({
      ...BASE_ENV,
      GEMINI_FALLBACK_MODELS_JUDGE: 'judge-fb-only',
    });
    expect(config.geminiModelChainFor(GeminiStep.Judge)).toEqual(['judge-fb-only']);
  });

  it('de-duplicates repeated model ids within a step chain', () => {
    const config = buildService({
      ...BASE_ENV,
      GEMINI_MODEL_GENERATION: 'gen-model',
      GEMINI_FALLBACK_MODELS_GENERATION: 'gen-model,gen-fb',
    });
    expect(config.geminiModelChainFor(GeminiStep.Generation)).toEqual(['gen-model', 'gen-fb']);
  });

  it('keeps steps independent — configuring one step never affects another', () => {
    const config = buildService({
      ...BASE_ENV,
      GEMINI_MODEL_TRANSLATION: 'cheap-fast',
    });
    expect(config.geminiModelChainFor(GeminiStep.Translation)).toEqual(['cheap-fast']);
    expect(config.geminiModelChainFor(GeminiStep.Judge)).toEqual([
      'global-primary',
      'global-fb-1',
      'global-fb-2',
    ]);
  });
});

describe('AppConfigService.aiRouteFor (multi-provider routes)', () => {
  it('maps the legacy gemini chain when no explicit route is set', () => {
    const config = buildService({ ...BASE_ENV, GEMINI_MODEL_JUDGE: 'judge-model' });
    expect(config.hasExplicitAiRoute(GeminiStep.Judge)).toBe(false);
    expect(config.aiRouteFor(GeminiStep.Judge)).toEqual([
      { provider: 'gemini', model: 'judge-model' },
    ]);
  });

  it('an explicit AI_ROUTE_<STEP> replaces the gemini chain entirely', () => {
    const config = buildService({
      ...BASE_ENV,
      GEMINI_MODEL_TRANSLATION: 'gemini-lite',
      AI_ROUTE_TRANSLATION: 'deepseek:deepseek-v4-flash,gemini-lite',
    });
    expect(config.hasExplicitAiRoute(GeminiStep.Translation)).toBe(true);
    expect(config.aiRouteFor(GeminiStep.Translation)).toEqual([
      { provider: 'deepseek', model: 'deepseek-v4-flash' },
      { provider: 'gemini', model: 'gemini-lite' },
    ]);
  });

  it('an invalid provider in a route throws a readable error', () => {
    const config = buildService({ ...BASE_ENV, AI_ROUTE_JUDGE: 'nonsense:model' });
    expect(() => config.aiRouteFor(GeminiStep.Judge)).toThrow(/unknown provider "nonsense"/);
  });

  it('de-duplicates route entries and rejects an unbounded chain', () => {
    const deduped = buildService({
      ...BASE_ENV,
      AI_ROUTE_JUDGE: 'gemini:model-a,gemini:model-a',
    });
    expect(deduped.aiRouteFor(GeminiStep.Judge)).toEqual([
      { provider: 'gemini', model: 'model-a' },
    ]);

    const unbounded = buildService({
      ...BASE_ENV,
      AI_ROUTE_JUDGE: Array.from(
        { length: MAX_AI_ROUTE_ENTRIES + 1 },
        (_unused, index) => `gemini:model-${index}`,
      ).join(','),
    });
    expect(() => unbounded.aiRouteFor(GeminiStep.Judge)).toThrow(/more than/u);
  });
});

describe('AppConfigService provider enablement + shadow routing', () => {
  it('a provider is enabled iff its API key is configured', () => {
    const config = buildService({ ...BASE_ENV, GEMINI_API_KEY: 'g-key', QWEN_API_KEY: 'q-key' });
    expect(config.isProviderEnabled('gemini')).toBe(true);
    expect(config.isProviderEnabled('qwen')).toBe(true);
    expect(config.isProviderEnabled('openai')).toBe(false);
  });

  it('applies the default base URL and honors an override', () => {
    const config = buildService({ ...BASE_ENV, DEEPSEEK_BASE_URL: 'https://proxy.local/v1' });
    expect(config.openAiCompatCredential('deepseek').baseUrl).toBe('https://proxy.local/v1');
    expect(config.openAiCompatCredential('kimi').baseUrl).toContain('moonshot');
  });

  it('shadowRouteFor returns the first configured entry or undefined', () => {
    const config = buildService({ ...BASE_ENV, AI_SHADOW_ROUTE_JUDGE: 'openai:gpt-5.4-mini' });
    expect(config.shadowRouteFor(GeminiStep.Judge)).toEqual({
      provider: 'openai',
      model: 'gpt-5.4-mini',
    });
    expect(config.shadowRouteFor(GeminiStep.Extraction)).toBeUndefined();
  });
});
