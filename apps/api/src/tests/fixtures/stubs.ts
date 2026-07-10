import { vi } from 'vitest';

import { AiProvider, type AiProviderValue } from '../../config/ai-provider.constants';
import type { AiRouteEntry } from '../../config/ai-route.types';
import type { AppConfigService } from '../../config/app-config.service';
import type { GeminiStepValue } from '../../config/gemini-step.constants';
import type { AppLogger } from '../../core/logger/app-logger.service';
import type { ClamAvAdapter } from '../../modules/file-security/adapters/clamav.adapter';

export interface AppLoggerStub {
  logger: AppLogger;
  messages: () => string[];
}

export const buildAppLoggerStub = (): AppLoggerStub => {
  const calls: string[] = [];
  const record = (message: string): void => {
    calls.push(message);
  };

  const logger = {
    setContext: vi.fn(),
    debug: vi.fn(record),
    info: vi.fn(record),
    warn: vi.fn(record),
    error: vi.fn(record),
  } as unknown as AppLogger;

  return { logger, messages: () => [...calls] };
};

/**
 * Deterministic ClamAV replacement for integration boots: always reports a
 * clean scan so test results never depend on the ambient ENABLE_CLAMAV
 * setting or a reachable clamd daemon (real scanners are never hit in tests).
 */
export const buildCleanClamAvStub = (): ClamAvAdapter =>
  ({
    scanBuffer: vi.fn(() => Promise.resolve({ clean: true })),
  }) as unknown as ClamAvAdapter;

const CONFIG_DEFAULTS = {
  nodeEnv: 'test',
  isProduction: false,
  isDevelopment: false,
  apiPort: 4000,
  corsAllowedOrigins: ['http://localhost:3000'],
  logLevel: 'info',
  swaggerEnabled: false,
  rateLimitTtlMs: 60_000,
  rateLimitMax: 30,
  geminiApiKey: 'test-key',
  geminiModel: 'test-model',
  geminiFallbackModels: [] as readonly string[],
  geminiModelChain: ['test-model'] as readonly string[],
  geminiTimeoutMs: 5000,
  geminiStreamIdleTimeoutMs: 60_000,
  aiMaxResponseBytes: 500_000,
  maxImageSizeBytes: 5_242_880,
  enableClamAv: false,
  clamAvHosts: ['localhost'] as readonly string[],
  clamAvPort: 3310,
  maxGlobalActiveAnalyses: 50,
  maxActiveAnalysesPerIp: 3,
  maxActiveAnalysesPerTab: 1,
  maxAnalysisQueueSize: 100,
  analysisTimeoutMs: 120_000,
  streamTtlMs: 180_000,
  // Per-step chain overrides for geminiModelChainFor; a step absent here
  // falls back to geminiModelChain, mirroring the real service's semantics.
  geminiStepModelChains: {} as Partial<Record<GeminiStepValue, readonly string[]>>,
  // Multi-provider routing surface (mirrors AppConfigService semantics).
  aiStepRoutes: {} as Partial<Record<GeminiStepValue, readonly AiRouteEntry[]>>,
  enabledProviders: [AiProvider.Gemini] as readonly AiProviderValue[],
  shadowEnabled: false,
  shadowSampleRate: 0,
  shadowTimeoutMs: 5000,
  shadowStepRoutes: {} as Partial<Record<GeminiStepValue, AiRouteEntry>>,
};

export const buildConfigStub = (
  overrides: Partial<typeof CONFIG_DEFAULTS> = {},
): AppConfigService => {
  const values = { ...CONFIG_DEFAULTS, ...overrides };
  const geminiModelChainFor = (step?: GeminiStepValue): readonly string[] =>
    (step === undefined ? undefined : values.geminiStepModelChains[step]) ??
    values.geminiModelChain;
  return {
    ...values,
    geminiModelChainFor,
    aiRouteFor: (step: GeminiStepValue): readonly AiRouteEntry[] =>
      values.aiStepRoutes[step] ??
      geminiModelChainFor(step).map((model) => ({ provider: AiProvider.Gemini, model })),
    hasExplicitAiRoute: (step: GeminiStepValue): boolean => values.aiStepRoutes[step] !== undefined,
    isProviderEnabled: (provider: AiProviderValue): boolean =>
      values.enabledProviders.includes(provider),
    openAiCompatCredential: (): { apiKey: string; baseUrl: string } => ({
      apiKey: 'test-key',
      baseUrl: 'https://provider.test/v1',
    }),
    shadowRouteFor: (step: GeminiStepValue): AiRouteEntry | undefined =>
      values.shadowStepRoutes[step],
  } as unknown as AppConfigService;
};
