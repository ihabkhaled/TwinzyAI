import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AiProvider,
  type AiProviderValue,
  OPENAI_COMPAT_DEFAULT_BASE_URLS,
  OPENAI_COMPAT_PROVIDER_ENV_KEYS,
  type OpenAiCompatCredential,
  type OpenAiCompatProviderValue,
} from './ai-provider.constants';
import type { AiRouteEntry } from './ai-route.types';
import { parseAiRouteList } from './ai-route.util';
import type { LogLevelValue, NodeEnvironment, ParsedEnv } from './env.schema';
import {
  AI_STEP_ROUTE_ENV_KEYS,
  AI_STEP_SHADOW_ROUTE_ENV_KEYS,
  GEMINI_STEP_ENV_KEYS,
  type GeminiStepValue,
} from './gemini-step.constants';

/**
 * The only injectable configuration surface. Wraps the config vendor behind
 * typed getters so consumers never touch ConfigService keys or process.env —
 * swapping the vendor touches only src/config.
 */
@Injectable()
export class AppConfigService {
  public constructor(private readonly configService: ConfigService<ParsedEnv, true>) {}

  public get nodeEnv(): NodeEnvironment {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  public get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  public get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  public get apiPort(): number {
    return this.configService.get('API_PORT', { infer: true });
  }

  public get corsAllowedOrigins(): readonly string[] {
    return this.toList(this.configService.get('CORS_ALLOWED_ORIGINS', { infer: true }));
  }

  public get logLevel(): LogLevelValue {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }

  /** Defaults to enabled everywhere except production when the flag is absent. */
  public get swaggerEnabled(): boolean {
    const configured: boolean | undefined = this.configService.get('ENABLE_SWAGGER', {
      infer: true,
    });
    return configured ?? !this.isProduction;
  }

  public get rateLimitTtlMs(): number {
    return this.configService.get('RATE_LIMIT_TTL_MS', { infer: true });
  }

  public get rateLimitMax(): number {
    return this.configService.get('RATE_LIMIT_MAX', { infer: true });
  }

  public get geminiApiKey(): string {
    return this.configService.get('GEMINI_API_KEY', { infer: true });
  }

  public get geminiModel(): string {
    return this.configService.get('GEMINI_MODEL', { infer: true });
  }

  /** Fallback model ids, in priority order (may be empty). */
  public get geminiFallbackModels(): readonly string[] {
    return this.toList(this.configService.get('GEMINI_FALLBACK_MODELS', { infer: true }));
  }

  /**
   * The ordered model chain the adapter tries: the primary model first, then
   * each configured fallback, de-duplicated and empty entries removed.
   */
  public get geminiModelChain(): readonly string[] {
    return [...new Set([this.geminiModel, ...this.geminiFallbackModels])].filter(
      (model) => model.length > 0,
    );
  }

  /**
   * The ordered model chain for one PIPELINE STEP. A step's chain is exactly
   * what its own env pair configures (primary + fallbacks, de-duplicated); a
   * step with both vars empty — or no step at all — uses the global chain.
   * Explicit by design: per-step values fully replace the global chain rather
   * than being merged with it, so operators can e.g. keep lite models out of
   * the extraction chain entirely.
   */
  public geminiModelChainFor(step?: GeminiStepValue): readonly string[] {
    if (step === undefined) {
      return this.geminiModelChain;
    }
    const keys = GEMINI_STEP_ENV_KEYS[step];
    const primary: string = this.configService.get(keys.model, { infer: true });
    const fallbacks = this.toList(this.configService.get(keys.fallbacks, { infer: true }));
    const chain = [...new Set([primary, ...fallbacks])].filter((model) => model.length > 0);
    return chain.length > 0 ? chain : this.geminiModelChain;
  }

  /**
   * The MULTI-PROVIDER route chain for one step. An explicit AI_ROUTE_<STEP>
   * fully replaces the Gemini chain for that step; when it is empty, the
   * legacy Gemini per-step chain (then global chain) is mapped to
   * `gemini:<model>` entries — a Gemini-only configuration stays valid.
   */
  public aiRouteFor(step: GeminiStepValue): readonly AiRouteEntry[] {
    const routeKey = AI_STEP_ROUTE_ENV_KEYS[step];
    const raw: string = this.configService.get(routeKey, { infer: true });
    const explicit = parseAiRouteList(raw, routeKey);
    if (explicit.length > 0) {
      return explicit;
    }
    return this.geminiModelChainFor(step).map((model) => ({
      provider: AiProvider.Gemini,
      model,
    }));
  }

  /** Whether this step's route chain was set explicitly via AI_ROUTE_<STEP>. */
  public hasExplicitAiRoute(step: GeminiStepValue): boolean {
    return this.configService.get(AI_STEP_ROUTE_ENV_KEYS[step], { infer: true }).length > 0;
  }

  /** Credential + base URL for one OpenAI-compatible provider (key may be empty). */
  public openAiCompatCredential(provider: OpenAiCompatProviderValue): OpenAiCompatCredential {
    const keys = OPENAI_COMPAT_PROVIDER_ENV_KEYS[provider];
    const apiKey: string = this.configService.get(keys.apiKey, { infer: true });
    const overrideBaseUrl: string = this.configService.get(keys.baseUrl, { infer: true });
    return {
      apiKey,
      baseUrl:
        overrideBaseUrl.length > 0 ? overrideBaseUrl : OPENAI_COMPAT_DEFAULT_BASE_URLS[provider],
    };
  }

  /** A provider is enabled iff its API key is configured (key = enable flag). */
  public isProviderEnabled(provider: AiProviderValue): boolean {
    if (provider === AiProvider.Gemini) {
      return this.geminiApiKey.length > 0;
    }
    return this.openAiCompatCredential(provider).apiKey.length > 0;
  }

  /** Shadow mode master switch (off by default). */
  public get shadowEnabled(): boolean {
    return this.configService.get('AI_SHADOW_ENABLED', { infer: true });
  }

  /** Fraction of eligible calls that also run the shadow route (0..1). */
  public get shadowSampleRate(): number {
    return this.configService.get('AI_SHADOW_SAMPLE_RATE', { infer: true });
  }

  /** Hard deadline for one shadow call — a slow shadow can never linger. */
  public get shadowTimeoutMs(): number {
    return this.configService.get('AI_SHADOW_TIMEOUT_MS', { infer: true });
  }

  /** The step's shadow route (first entry when several are configured). */
  public shadowRouteFor(step: GeminiStepValue): AiRouteEntry | undefined {
    const key = AI_STEP_SHADOW_ROUTE_ENV_KEYS[step];
    if (key === undefined) {
      return undefined;
    }
    const entries = parseAiRouteList(this.configService.get(key, { infer: true }), key);
    return entries[0];
  }

  public get geminiTimeoutMs(): number {
    return this.configService.get('GEMINI_TIMEOUT_MS', { infer: true });
  }

  public get geminiStreamIdleTimeoutMs(): number {
    return this.configService.get('GEMINI_STREAM_IDLE_TIMEOUT_MS', { infer: true });
  }

  public get aiMaxResponseBytes(): number {
    return this.configService.get('AI_MAX_RESPONSE_BYTES', { infer: true });
  }

  public get maxImageSizeBytes(): number {
    return this.configService.get('MAX_IMAGE_SIZE_BYTES', { infer: true });
  }

  public get enableClamAv(): boolean {
    return this.configService.get('ENABLE_CLAMAV', { infer: true });
  }

  /** Ordered clamd hosts to try; the adapter caches the first reachable one. */
  public get clamAvHosts(): readonly string[] {
    return this.toList(this.configService.get('CLAMAV_HOSTS', { infer: true }));
  }

  public get clamAvPort(): number {
    return this.configService.get('CLAMAV_PORT', { infer: true });
  }

  /** Max streaming analyses allowed to run concurrently across the whole API. */
  public get maxGlobalActiveAnalyses(): number {
    return this.configService.get('MAX_GLOBAL_ACTIVE_ANALYSES', { infer: true });
  }

  /** Max concurrent streaming analyses allowed from a single client IP. */
  public get maxActiveAnalysesPerIp(): number {
    return this.configService.get('MAX_ACTIVE_ANALYSES_PER_IP', { infer: true });
  }

  /** Max concurrent streaming analyses allowed from a single browser tab. */
  public get maxActiveAnalysesPerTab(): number {
    return this.configService.get('MAX_ACTIVE_ANALYSES_PER_TAB', { infer: true });
  }

  /** Max analyses that may wait for a slot before new ones are rejected busy. */
  public get maxAnalysisQueueSize(): number {
    return this.configService.get('MAX_ANALYSIS_QUEUE_SIZE', { infer: true });
  }

  /** Watchdog ceiling: max time an analysis may run or a waiter may queue. */
  public get analysisTimeoutMs(): number {
    return this.configService.get('ANALYSIS_TIMEOUT_MS', { infer: true });
  }

  /** How long an orphaned stream-registry entry survives before reclamation. */
  public get streamTtlMs(): number {
    return this.configService.get('STREAM_TTL_MS', { infer: true });
  }

  /** Time-to-live (seconds) for a temporary shared result before it expires. */
  public get shareResultTtlSeconds(): number {
    return this.configService.get('SHARE_RESULT_TTL_SECONDS', { infer: true });
  }

  /** Hard cap on a stored shared-result payload's JSON byte size. */
  public get shareResultMaxPayloadBytes(): number {
    return this.configService.get('SHARE_RESULT_MAX_PAYLOAD_BYTES', { infer: true });
  }

  /** Cap on concurrently-active share records (bounds total cache memory). */
  public get shareResultMaxActiveItems(): number {
    return this.configService.get('SHARE_RESULT_MAX_ACTIVE_ITEMS', { infer: true });
  }

  /** Public web origin used to build the `/share/<uuid>` link (server config only). */
  public get shareResultPublicBaseUrl(): string {
    return this.configService.get('SHARE_RESULT_PUBLIC_BASE_URL', { infer: true });
  }

  private toList(value: string): string[] {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
}
