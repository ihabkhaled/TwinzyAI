import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { LogLevelValue, NodeEnvironment, ParsedEnv } from './env.schema';

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
    return this.configService
      .get('CORS_ALLOWED_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
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

  public get geminiTimeoutMs(): number {
    return this.configService.get('GEMINI_TIMEOUT_MS', { infer: true });
  }

  public get geminiStreamIdleTimeoutMs(): number {
    return this.configService.get('GEMINI_STREAM_IDLE_TIMEOUT_MS', { infer: true });
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

  private toList(value: string): string[] {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
}
