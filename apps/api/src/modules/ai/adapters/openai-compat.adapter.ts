import { HTTP_STATUS_TOO_MANY_REQUESTS } from '@twinzy/shared';

import type { OpenAiCompatProviderValue } from '../../../config/ai-provider.constants';
import type { AppConfigService } from '../../../config/app-config.service';
import {
  buildIntegrationError,
  buildTooManyRequestsError,
  ErrorCode,
  IntegrationError,
  TooManyRequestsError,
} from '../../../core/errors';
import type { AppLogger } from '../../../core/logger/app-logger.service';
import { attachExternalAbort } from '../lib/abort-bridge.util';
import type {
  AiCallOptions,
  AiProviderAdapter,
  AiStreamOptions,
} from '../model/ai-provider-adapter.types';
import {
  AI_RATE_LIMITED_MESSAGE,
  AI_TIMEOUT_MESSAGE,
  AI_UNAVAILABLE_MESSAGE,
} from '../model/gemini.constants';
import type { AiImageInput } from '../model/gemini.types';
import { CHAT_COMPLETIONS_PATH, OPENAI_COMPAT_TEMPERATURE } from '../model/openai-compat.constants';
import type {
  OpenAiCompatContentPart,
  OpenAiCompatRequestBody,
  OpenAiCompatResponseBody,
} from '../model/openai-compat.types';

/**
 * ONE adapter for every OpenAI-compatible chat-completions provider (OpenAI,
 * DeepSeek, Qwen, Kimi, GLM), parameterized per provider with its base URL +
 * API key from typed config. Uses the platform `fetch` — deliberately no new
 * SDK dependency; this file IS the vendor wrapper for these providers.
 *
 * Contract notes:
 * - The router pins each dispatch to one model via `options.models`; this
 *   adapter never reads provider/model ids from anywhere but config/options.
 * - The *Stream port methods perform a non-streaming call (the app-level SSE
 *   heartbeats keep the client connection alive; provider-side streaming is a
 *   later optimization), firing `onChunk` once with the full text.
 * - Bodies are never logged; errors log status + provider + model only.
 * - Instances are only ever created by the provider registry for providers
 *   whose API key is configured.
 */
export class OpenAiCompatAdapter implements AiProviderAdapter {
  public constructor(
    private readonly provider: OpenAiCompatProviderValue,
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(`AiProvider:${provider}`);
  }

  public async generateFromImage(
    prompt: string,
    image: AiImageInput,
    options?: AiCallOptions,
  ): Promise<string> {
    return this.generateOnce(this.imageContent(prompt, image), options);
  }

  public async generateFromText(prompt: string, options?: AiCallOptions): Promise<string> {
    return this.generateOnce(prompt, options);
  }

  public async generateFromImageStream(
    prompt: string,
    image: AiImageInput,
    options?: AiStreamOptions,
  ): Promise<string> {
    const text = await this.generateOnce(this.imageContent(prompt, image), options);
    options?.onChunk?.(text);
    return text;
  }

  public async generateFromTextStream(prompt: string, options?: AiStreamOptions): Promise<string> {
    const text = await this.generateOnce(prompt, options);
    options?.onChunk?.(text);
    return text;
  }

  private imageContent(prompt: string, image: AiImageInput): readonly OpenAiCompatContentPart[] {
    return [
      { type: 'text', text: prompt },
      {
        type: 'image_url',
        image_url: { url: `data:${image.mimeType};base64,${image.base64Data}` },
      },
    ];
  }

  /**
   * One bounded chat-completions call for the single model the router pinned.
   * 429 → typed rate-limit (router may hop providers); timeout → AI_TIMEOUT;
   * other HTTP/network failures → AI_PROVIDER_UNAVAILABLE; empty content or a
   * failing content validation → AI_RESPONSE_INVALID.
   */
  private async generateOnce(
    content: string | readonly OpenAiCompatContentPart[],
    options?: AiStreamOptions,
  ): Promise<string> {
    const model = this.requireModel(options);
    const startedAt = Date.now();
    const text = await this.postChatCompletion(model, content, options?.signal);

    if (options?.validate !== undefined) {
      const validation = options.validate(text);
      if (!validation.ok) {
        this.logger.warn(
          `Model ${model} returned content that failed validation (step=${options.step ?? 'default'}, ${validation.reason ?? 'unknown'})`,
        );
        throw this.integrationError(ErrorCode.AiResponseInvalid, AI_UNAVAILABLE_MESSAGE);
      }
    }
    this.logger.info(
      `Step ${options?.step ?? 'default'} served by ${this.provider}:${model} (${Date.now() - startedAt}ms)`,
    );
    return text;
  }

  private requireModel(options?: AiCallOptions): string {
    const model = options?.models?.[0];
    if (model === undefined || model.length === 0) {
      throw this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
    }
    return model;
  }

  private async postChatCompletion(
    model: string,
    content: string | readonly OpenAiCompatContentPart[],
    externalSignal?: AbortSignal,
  ): Promise<string> {
    const credential = this.config.openAiCompatCredential(this.provider);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.config.geminiTimeoutMs);
    const detachExternalAbort = attachExternalAbort(controller, externalSignal);

    const body: OpenAiCompatRequestBody = {
      model,
      messages: [{ role: 'user', content }],
      temperature: OPENAI_COMPAT_TEMPERATURE,
      response_format: { type: 'json_object' },
    };

    try {
      const response = await globalThis.fetch(`${credential.baseUrl}${CHAT_COMPLETIONS_PATH}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${credential.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      return await this.readResponseText(response, model);
    } catch (error: unknown) {
      throw this.normalizeTransportError(error, controller.signal.aborted, model);
    } finally {
      clearTimeout(timer);
      detachExternalAbort?.();
    }
  }

  private async readResponseText(response: Response, model: string): Promise<string> {
    if (response.status === HTTP_STATUS_TOO_MANY_REQUESTS) {
      this.logger.warn(`Model ${model} rate-limited (429)`);
      throw buildTooManyRequestsError(ErrorCode.AiRateLimited, AI_RATE_LIMITED_MESSAGE);
    }
    if (!response.ok) {
      this.logger.warn(`Model ${model} failed with HTTP ${response.status}`);
      throw this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
    }
    let payload: OpenAiCompatResponseBody | undefined;
    try {
      payload = (await response.json()) as OpenAiCompatResponseBody;
    } catch {
      // Non-JSON body — treated as an invalid response below.
    }
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw this.integrationError(ErrorCode.AiResponseInvalid, AI_UNAVAILABLE_MESSAGE);
    }
    return text;
  }

  /** Preserve typed errors; map an abort to AI_TIMEOUT and anything else to 502. */
  private normalizeTransportError(error: unknown, aborted: boolean, model: string): Error {
    if (error instanceof TooManyRequestsError || error instanceof IntegrationError) {
      return error;
    }
    if (aborted) {
      this.logger.warn(`Model ${model} call aborted by timeout/cancel`);
      return this.integrationError(ErrorCode.AiTimeout, AI_TIMEOUT_MESSAGE);
    }
    this.logger.warn(`Model ${model} transport failure`);
    return this.integrationError(ErrorCode.AiProviderUnavailable, AI_UNAVAILABLE_MESSAGE);
  }

  private integrationError(
    errorCode: Parameters<typeof buildIntegrationError>[0],
    message: string,
  ): IntegrationError {
    return buildIntegrationError(errorCode, message);
  }
}
