import type { Part } from '@google/genai';
import { GoogleGenAI } from '@google/genai';
import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { AppConfigService } from '../../../config/app-config.service';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { redactForLog } from '../../privacy/utils/log-redaction.util';
import {
  AI_TIMEOUT_MESSAGE,
  AI_UNAVAILABLE_MESSAGE,
  GEMINI_RESPONSE_MIME_TYPE,
  GEMINI_TEMPERATURE,
} from '../constants/gemini.constants';
import type { AiProviderAdapter } from '../interfaces/ai-provider-adapter.interface';
import type { AiImageInput } from '../types/gemini.types';

const LOG_CONTEXT = 'GeminiAdapter';

/**
 * The ONLY file in the codebase allowed to import the Gemini SDK.
 * Model id and API key come exclusively from configuration; the model name
 * is never hardcoded. Image bytes are never logged.
 */
@Injectable()
export class GeminiAdapter implements AiProviderAdapter {
  private client: GoogleGenAI | undefined;

  public constructor(
    private readonly config: AppConfigService,
    private readonly logger: LoggerService,
  ) {}

  public async generateFromImage(prompt: string, image: AiImageInput): Promise<string> {
    return this.generate([
      { inlineData: { mimeType: image.mimeType, data: image.base64Data } },
      { text: prompt },
    ]);
  }

  public async generateFromText(prompt: string): Promise<string> {
    return this.generate([{ text: prompt }]);
  }

  private async generate(parts: Part[]): Promise<string> {
    const model = this.requireModel();
    const client = this.requireClient();
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.config.geminiTimeoutMs);
    const startedAt = Date.now();

    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          abortSignal: controller.signal,
          temperature: GEMINI_TEMPERATURE,
          responseMimeType: GEMINI_RESPONSE_MIME_TYPE,
        },
      });

      const text = response.text;
      if (text === undefined || text.trim().length === 0) {
        throw new DomainException(
          ErrorCode.AiResponseInvalid,
          AI_UNAVAILABLE_MESSAGE,
          HttpStatus.BAD_GATEWAY,
        );
      }

      this.logger.log(LOG_CONTEXT, `Call ok (model=${model}, ms=${Date.now() - startedAt})`);
      return text;
    } catch (error: unknown) {
      throw this.mapError(error, controller.signal.aborted);
    } finally {
      clearTimeout(timer);
    }
  }

  private mapError(error: unknown, aborted: boolean): DomainException {
    if (error instanceof DomainException) {
      return error;
    }

    if (aborted) {
      this.logger.warn(LOG_CONTEXT, 'Call aborted by timeout');
      return new DomainException(
        ErrorCode.AiTimeout,
        AI_TIMEOUT_MESSAGE,
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    const rawMessage = error instanceof Error ? error.message : 'Unknown provider error';
    this.logger.error(LOG_CONTEXT, `Provider error: ${redactForLog(rawMessage)}`);
    return new DomainException(
      ErrorCode.AiProviderUnavailable,
      AI_UNAVAILABLE_MESSAGE,
      HttpStatus.BAD_GATEWAY,
    );
  }

  private requireModel(): string {
    const model = this.config.geminiModel;
    if (model.length === 0) {
      throw new DomainException(
        ErrorCode.AiProviderUnavailable,
        AI_UNAVAILABLE_MESSAGE,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return model;
  }

  private requireClient(): GoogleGenAI {
    if (this.client !== undefined) {
      return this.client;
    }

    const apiKey = this.config.geminiApiKey;
    if (apiKey.length === 0) {
      throw new DomainException(
        ErrorCode.AiProviderUnavailable,
        AI_UNAVAILABLE_MESSAGE,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }
}
