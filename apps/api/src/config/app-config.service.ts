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

  public get geminiTimeoutMs(): number {
    return this.configService.get('GEMINI_TIMEOUT_MS', { infer: true });
  }

  public get maxImageSizeBytes(): number {
    return this.configService.get('MAX_IMAGE_SIZE_BYTES', { infer: true });
  }

  public get enableClamAv(): boolean {
    return this.configService.get('ENABLE_CLAMAV', { infer: true });
  }

  public get clamAvHost(): string {
    return this.configService.get('CLAMAV_HOST', { infer: true });
  }

  public get clamAvPort(): number {
    return this.configService.get('CLAMAV_PORT', { infer: true });
  }
}
