import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

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
