import type { Part } from '@google/genai';
import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import {
  AppError,
  ERROR_MESSAGE_KEY_BY_CODE,
  ErrorCode,
  type ErrorCodeValue,
  IntegrationError,
} from '../../../core/errors';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { redactForLog } from '../../privacy';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';
import {
  AI_TIMEOUT_MESSAGE,
  AI_UNAVAILABLE_MESSAGE,
  GEMINI_RESPONSE_MIME_TYPE,
  GEMINI_TEMPERATURE,
} from '../model/gemini.constants';
import type { AiImageInput } from '../model/gemini.types';

const LOG_CONTEXT = 'GeminiAdapter';

/**
 * The ONLY file in the codebase allowed to import the Gemini SDK.
 * Model id and API key come exclusively from configuration; the model name
 * is never hardcoded. Image bytes are never logged. Every failure surfaces as
 * an IntegrationError (502) carrying a stable AI error code and a user-safe
 * message; provider error text is redacted before it ever reaches a log line.
 */
@Injectable()
export class GeminiAdapter implements AiProviderAdapter {
  private client: GoogleGenAI | undefined;

  public constructor(
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

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
        throw this.integrationError(ErrorCode.AiResponseInvalid, AI_UNAVAILABLE_MESSAGE);
      }

      this.logger.info(`Call ok (model=${model}, ms=${Date.now() - startedAt})`);
      return text;
    } catch (error: unknown) {
      throw this.mapError(error, controller.signal.aborted);
    } finally {
      clearTimeout(timer);
    }
  }

  private mapError(error: unknown, aborted: boolean): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (aborted) {
      this.logger.warn('Call aborted by timeout');
      return this.integrationError(ErrorCode.AiTimeout, AI_TIMEOUT_MESSAGE);
    }

    const rawMessage = error instanceof Error ? error.message : 'Unknown provider error';
    this.logger.error(`Provider error: ${redactForLog(rawMessage)}`);
    return this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
  }

  private requireModel(): string {
    const model = this.config.geminiModel;
    if (model.length === 0) {
      throw this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
    }
    return model;
  }

  private requireClient(): GoogleGenAI {
    if (this.client !== undefined) {
      return this.client;
    }

    const apiKey = this.config.geminiApiKey;
    if (apiKey.length === 0) {
      throw this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
    }

    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  private integrationError(errorCode: ErrorCodeValue, message: string): IntegrationError {
    return new IntegrationError(message, ERROR_MESSAGE_KEY_BY_CODE[errorCode], errorCode);
  }
}
