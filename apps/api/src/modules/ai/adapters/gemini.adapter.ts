import type { GenerateContentConfig, Part } from '@google/genai';
import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import {
  AppError,
  buildIntegrationError,
  buildTooManyRequestsError,
  ErrorCode,
  type IntegrationError,
  type TooManyRequestsError,
} from '../../../core/errors';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { redactForLog } from '../../privacy';
import { attachExternalAbort } from '../lib/abort-bridge.util';
import {
  classifyProviderError,
  isModelRetryable,
  ProviderErrorKind,
  type ProviderErrorKindValue,
} from '../lib/provider-error.util';
import type {
  AiCallOptions,
  AiProviderAdapter,
  AiStreamChunkListener,
  AiStreamOptions,
} from '../model/ai-provider-adapter.types';
import {
  AI_INVALID_RESPONSE_MESSAGE,
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

  public async generateFromImage(
    prompt: string,
    image: AiImageInput,
    options?: AiCallOptions,
  ): Promise<string> {
    return this.runAcrossModels(
      (model) => this.generateOnce(model, this.imageParts(prompt, image)),
      options,
    );
  }

  public async generateFromText(prompt: string, options?: AiCallOptions): Promise<string> {
    return this.runAcrossModels((model) => this.generateOnce(model, [{ text: prompt }]), options);
  }

  public async generateFromImageStream(
    prompt: string,
    image: AiImageInput,
    options?: AiStreamOptions,
  ): Promise<string> {
    return this.runAcrossModels(
      (model) =>
        this.generateStreamOnce(
          model,
          this.imageParts(prompt, image),
          options?.onChunk,
          options?.signal,
        ),
      options,
    );
  }

  public async generateFromTextStream(prompt: string, options?: AiStreamOptions): Promise<string> {
    return this.runAcrossModels(
      (model) =>
        this.generateStreamOnce(model, [{ text: prompt }], options?.onChunk, options?.signal),
      options,
    );
  }

  private imageParts(prompt: string, image: AiImageInput): Part[] {
    return [{ inlineData: { mimeType: image.mimeType, data: image.base64Data } }, { text: prompt }];
  }

  /**
   * Tries the call against each model in the step's configured chain (or the
   * global chain when the call carries no step). Our own AppErrors (timeout,
   * empty response) are terminal; raw provider errors are classified and, when
   * retryable, fall through to the next model. If the caller supplies a
   * content validator, a model whose returned text fails validation is also
   * retried on the next model. Exhausting the chain surfaces a 429 if any
   * model was rate-limited, otherwise a 502.
   */
  private async runAcrossModels(call: ModelCall, options?: AiStreamOptions): Promise<string> {
    const models = this.requireModelChain(options);
    let sawRateLimit = false;

    for (const model of models) {
      options?.signal?.throwIfAborted();
      try {
        const text = await call(model);
        if (!this.acceptModelText(model, text, options)) {
          continue;
        }
        return text;
      } catch (error: unknown) {
        if (error instanceof AppError) {
          throw error;
        }
        const kind = classifyProviderError(error);
        this.logProviderError(model, error, kind);
        sawRateLimit ||= kind === ProviderErrorKind.RateLimited;
        if (!isModelRetryable(kind)) {
          throw this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
        }
      }
    }

    throw sawRateLimit
      ? this.rateLimitedError()
      : this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
  }

  /**
   * Accepts or rejects one model's returned text. Without a validator every
   * non-empty text is accepted; with one, a failing text logs its bounded,
   * privacy-safe reason (field paths + issue codes, never values) and reports
   * false so the chain advances to the next model. Successful serves are
   * logged with their step so per-step routing is observable in production.
   */
  private acceptModelText(model: string, text: string, options?: AiStreamOptions): boolean {
    const stepTag = options?.step ?? 'default';
    if (options?.validate !== undefined) {
      const validation = options.validate(text);
      if (!validation.ok) {
        this.logger.warn(
          `Model ${model} returned content that failed validation (step=${stepTag}, ${validation.reason ?? 'unknown'}); trying next model`,
        );
        return false;
      }
    }
    this.logger.info(`Step ${stepTag} served by model ${model}`);
    return true;
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
    externalSignal?: AbortSignal,
  ): Promise<string> {
    const controller = new AbortController();
    const detachExternalAbort = attachExternalAbort(controller, externalSignal);
    const startedAt = Date.now();
    const totalTimer = setTimeout(() => {
      controller.abort();
    }, this.config.geminiTimeoutMs);
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
      let assembledBytes = 0;
      for await (const chunk of stream) {
        resetIdleTimer();
        const chunkText = chunk.text;
        if (chunkText !== undefined && chunkText.length > 0) {
          assembledBytes += Buffer.byteLength(chunkText, 'utf8');
          if (assembledBytes > this.config.aiMaxResponseBytes) {
            controller.abort();
            throw this.integrationError(ErrorCode.AiResponseInvalid, AI_INVALID_RESPONSE_MESSAGE);
          }
          assembled += chunkText;
          onChunk?.(chunkText);
        }
      }
      return this.requireText(assembled, model, startedAt, 'Stream');
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      if (controller.signal.aborted) {
        throw this.timeoutError();
      }
      throw error;
    } finally {
      detachExternalAbort?.();
      clearTimeout(totalTimer);
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
    if (Buffer.byteLength(text, 'utf8') > this.config.aiMaxResponseBytes) {
      throw this.integrationError(ErrorCode.AiResponseInvalid, AI_INVALID_RESPONSE_MESSAGE);
    }
    this.logger.info(`${label} ok (model=${model}, ms=${Date.now() - startedAt})`);
    return text;
  }

  private logProviderError(model: string, error: unknown, kind: ProviderErrorKindValue): void {
    const rawMessage = error instanceof Error ? error.message : 'Unknown provider error';
    this.logger.warn(`Model ${model} failed (${kind}): ${redactForLog(rawMessage)}`);
  }

  /**
   * The models this call walks: the router's explicit per-dispatch override
   * when present (one entry per cross-provider route hop), otherwise the
   * step's env-configured chain, otherwise the global chain.
   */
  private requireModelChain(options?: AiStreamOptions): readonly string[] {
    const models = options?.models ?? this.config.geminiModelChainFor(options?.step);
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
    return buildTooManyRequestsError(ErrorCode.AiRateLimited, AI_RATE_LIMITED_MESSAGE);
  }

  private integrationError(
    errorCode: Parameters<typeof buildIntegrationError>[0],
    message: string,
  ): IntegrationError {
    return buildIntegrationError(errorCode, message);
  }
}
