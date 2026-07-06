import type { GenerateContentConfig, Part } from '@google/genai';
import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import {
  AppError,
  ERROR_MESSAGE_KEY_BY_CODE,
  ErrorCode,
  type ErrorCodeValue,
  IntegrationError,
  TooManyRequestsError,
} from '../../../core/errors';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { redactForLog } from '../../privacy';
import {
  classifyProviderError,
  isModelRetryable,
  ProviderErrorKind,
  type ProviderErrorKindValue,
} from '../lib/provider-error.util';
import type { AiProviderAdapter, AiStreamChunkListener } from '../model/ai-provider-adapter.types';
import {
  AI_RATE_LIMITED_MESSAGE,
  AI_TIMEOUT_MESSAGE,
  AI_UNAVAILABLE_MESSAGE,
  GEMINI_RESPONSE_MIME_TYPE,
  GEMINI_TEMPERATURE,
} from '../model/gemini.constants';
import type { AiImageInput, ModelCall } from '../model/gemini.types';

const LOG_CONTEXT = 'GeminiAdapter';

/**
 * The ONLY file in the codebase allowed to import the Gemini SDK.
 * Model ids and the API key come exclusively from configuration; model names
 * are never hardcoded. Image bytes are never logged.
 *
 * Resilience: every call runs against the configured model chain (primary +
 * GEMINI_FALLBACK_MODELS). A rate-limit (429), overload, or unavailable-model
 * error is retried on the NEXT model before giving up, so a single model's
 * quota does not take the game down. When every model is rate-limited the call
 * fails with a 429 AI_RATE_LIMITED the UI can invite a retry on; any other
 * exhaustion is a safe 502. Provider error text is redacted before logging.
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
    return this.runAcrossModels((model) =>
      this.generateOnce(model, this.imageParts(prompt, image)),
    );
  }

  public async generateFromText(prompt: string): Promise<string> {
    return this.runAcrossModels((model) => this.generateOnce(model, [{ text: prompt }]));
  }

  public async generateFromImageStream(
    prompt: string,
    image: AiImageInput,
    onChunk?: AiStreamChunkListener,
  ): Promise<string> {
    return this.runAcrossModels((model) =>
      this.generateStreamOnce(model, this.imageParts(prompt, image), onChunk),
    );
  }

  public async generateFromTextStream(
    prompt: string,
    onChunk?: AiStreamChunkListener,
  ): Promise<string> {
    return this.runAcrossModels((model) =>
      this.generateStreamOnce(model, [{ text: prompt }], onChunk),
    );
  }

  private imageParts(prompt: string, image: AiImageInput): Part[] {
    return [{ inlineData: { mimeType: image.mimeType, data: image.base64Data } }, { text: prompt }];
  }

  /**
   * Tries the call against each model in the chain. Our own AppErrors (timeout,
   * empty response) are terminal; raw provider errors are classified and, when
   * retryable, fall through to the next model. Exhausting the chain surfaces a
   * 429 if any model was rate-limited, otherwise a 502.
   */
  private async runAcrossModels(call: ModelCall): Promise<string> {
    const models = this.requireModelChain();
    let sawRateLimit = false;

    for (const model of models) {
      try {
        return await call(model);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          throw error;
        }
        const kind = classifyProviderError(error);
        this.logProviderError(model, error, kind);
        sawRateLimit = sawRateLimit || kind === ProviderErrorKind.RateLimited;
        if (!isModelRetryable(kind)) {
          throw this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
        }
      }
    }

    throw sawRateLimit
      ? this.rateLimitedError()
      : this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
  }

  private async generateOnce(model: string, parts: Part[]): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.config.geminiTimeoutMs);
    const startedAt = Date.now();

    try {
      const response = await this.requireClient().models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: this.requestConfig(controller.signal),
      });
      return this.requireText(response.text, model, startedAt, 'Call');
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        throw this.timeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Streaming attempt. An idle timer is reset on every chunk, so the call is
   * aborted only after a full idle window with no new output — never while the
   * model is still producing. The full text is assembled and returned so the
   * caller validates the complete JSON exactly as the non-streaming path does.
   */
  private async generateStreamOnce(
    model: string,
    parts: Part[],
    onChunk?: AiStreamChunkListener,
  ): Promise<string> {
    const controller = new AbortController();
    const startedAt = Date.now();
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const resetIdleTimer = (): void => {
      if (idleTimer !== undefined) {
        clearTimeout(idleTimer);
      }
      idleTimer = setTimeout(() => {
        controller.abort();
      }, this.config.geminiStreamIdleTimeoutMs);
    };

    try {
      resetIdleTimer();
      const stream = await this.requireClient().models.generateContentStream({
        model,
        contents: [{ role: 'user', parts }],
        config: this.requestConfig(controller.signal),
      });

      let assembled = '';
      for await (const chunk of stream) {
        resetIdleTimer();
        const chunkText = chunk.text;
        if (chunkText !== undefined && chunkText.length > 0) {
          assembled += chunkText;
          onChunk?.(chunkText);
        }
      }
      return this.requireText(assembled, model, startedAt, 'Stream');
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        throw this.timeoutError();
      }
      throw error;
    } finally {
      if (idleTimer !== undefined) {
        clearTimeout(idleTimer);
      }
    }
  }

  private requestConfig(abortSignal: AbortSignal): GenerateContentConfig {
    return {
      abortSignal,
      temperature: GEMINI_TEMPERATURE,
      responseMimeType: GEMINI_RESPONSE_MIME_TYPE,
    };
  }

  private requireText(
    text: string | undefined,
    model: string,
    startedAt: number,
    label: string,
  ): string {
    if (text === undefined || text.trim().length === 0) {
      throw this.integrationError(ErrorCode.AiResponseInvalid, AI_UNAVAILABLE_MESSAGE);
    }
    this.logger.info(`${label} ok (model=${model}, ms=${Date.now() - startedAt})`);
    return text;
  }

  private logProviderError(model: string, error: unknown, kind: ProviderErrorKindValue): void {
    const rawMessage = error instanceof Error ? error.message : 'Unknown provider error';
    this.logger.warn(`Model ${model} failed (${kind}): ${redactForLog(rawMessage)}`);
  }

  private requireModelChain(): readonly string[] {
    const models = this.config.geminiModelChain;
    if (models.length === 0) {
      throw this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
    }
    return models;
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

  private timeoutError(): IntegrationError {
    this.logger.warn('Call aborted by timeout');
    return this.integrationError(ErrorCode.AiTimeout, AI_TIMEOUT_MESSAGE);
  }

  private rateLimitedError(): TooManyRequestsError {
    this.logger.warn('All models rate-limited');
    return new TooManyRequestsError(
      AI_RATE_LIMITED_MESSAGE,
      ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.AiRateLimited],
      ErrorCode.AiRateLimited,
    );
  }

  private integrationError(errorCode: ErrorCodeValue, message: string): IntegrationError {
    return new IntegrationError(message, ERROR_MESSAGE_KEY_BY_CODE[errorCode], errorCode);
  }
}
