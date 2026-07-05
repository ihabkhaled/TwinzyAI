import { Injectable } from '@nestjs/common';

import { loadEnvFiles } from './env.loader';
import type { NodeEnvironment, ParsedEnv } from './env.schema';
import { EnvSchema } from './env.schema';

/**
 * The only place in the API allowed to read process.env.
 * Everything else injects this service and uses typed getters.
 */
@Injectable()
export class AppConfigService {
  private readonly env: ParsedEnv;

  public constructor() {
    loadEnvFiles();
    this.env = EnvSchema.parse(process.env);
  }

  public get nodeEnv(): NodeEnvironment {
    return this.env.NODE_ENV;
  }

  public get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  public get apiPort(): number {
    return this.env.API_PORT;
  }

  public get corsAllowedOrigins(): readonly string[] {
    return this.env.CORS_ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  public get geminiApiKey(): string {
    return this.env.GEMINI_API_KEY;
  }

  public get geminiModel(): string {
    return this.env.GEMINI_MODEL;
  }

  public get geminiTimeoutMs(): number {
    return this.env.GEMINI_TIMEOUT_MS;
  }

  public get maxImageSizeBytes(): number {
    return this.env.MAX_IMAGE_SIZE_BYTES;
  }

  public get enableClamAv(): boolean {
    return this.env.ENABLE_CLAMAV;
  }

  public get clamAvHost(): string {
    return this.env.CLAMAV_HOST;
  }

  public get clamAvPort(): number {
    return this.env.CLAMAV_PORT;
  }
}
