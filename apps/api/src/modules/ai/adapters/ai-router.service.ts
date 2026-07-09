import { Injectable } from '@nestjs/common';

import { routeEntryKey } from '../../../config/ai-route.types';
import {
  AppError,
  ERROR_MESSAGE_KEY_BY_CODE,
  ErrorCode,
  type ErrorCodeValue,
  IntegrationError,
  TooManyRequestsError,
} from '../../../core/errors';
import { AppLogger } from '../../../core/logger/app-logger.service';
import type {
  AiCallOptions,
  AiProviderAdapter,
  AiStreamOptions,
} from '../model/ai-provider-adapter.types';
import { ROUTE_HOPPABLE_ERROR_CODES } from '../model/ai-router.constants';
import type { RouteDispatch } from '../model/ai-router.types';
import { AI_RATE_LIMITED_MESSAGE, AI_UNAVAILABLE_MESSAGE } from '../model/gemini.constants';
import type { AiImageInput } from '../model/gemini.types';

import { AiShadowService } from './ai-shadow.service';
import { ProviderRegistryService } from './provider-registry.service';

const LOG_CONTEXT = 'AiRouter';

/**
 * The provider-agnostic dispatcher bound to the AI_PROVIDER_ADAPTER port: step
 * services keep calling the same interface, and this router resolves the
 * step's env-configured route chain (`provider:model` entries), enforces the
 * fail-closed image rule (photo-carrying calls dispatch only to vision-capable
 * entries), walks the chain ACROSS providers on recoverable failures, and
 * triggers the sampled shadow run after a successful primary. Each dispatch
 * pins the target adapter to exactly one model; adapters keep owning their own
 * transport, timeouts, and error normalization.
 */
@Injectable()
export class AiRouterService implements AiProviderAdapter {
  public constructor(
    private readonly registry: ProviderRegistryService,
    private readonly shadow: AiShadowService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async generateFromImage(
    prompt: string,
    image: AiImageInput,
    options?: AiCallOptions,
  ): Promise<string> {
    // Non-stream calls carry no signal; adapters bound them with their own timeouts.
    return this.runRoute(
      (adapter, models) => adapter.generateFromImage(prompt, image, { ...options, models }),
      options,
      true,
    );
  }

  public async generateFromText(prompt: string, options?: AiCallOptions): Promise<string> {
    return this.runRoute(
      (adapter, models) => adapter.generateFromText(prompt, { ...options, models }),
      options,
      false,
    );
  }

  public async generateFromImageStream(
    prompt: string,
    image: AiImageInput,
    options?: AiStreamOptions,
  ): Promise<string> {
    return this.runRoute(
      (adapter, models, signal) =>
        adapter.generateFromImageStream(prompt, image, {
          ...options,
          models,
          signal: signal ?? options?.signal,
        }),
      options,
      true,
    );
  }

  public async generateFromTextStream(prompt: string, options?: AiStreamOptions): Promise<string> {
    return this.runRoute(
      (adapter, models, signal) =>
        adapter.generateFromTextStream(prompt, {
          ...options,
          models,
          signal: signal ?? options?.signal,
        }),
      options,
      false,
    );
  }

  /**
   * Walks the step's usable route entries: each hop dispatches one
   * provider:model; a recoverable failure (rate limit, unavailable, timeout,
   * invalid content) advances to the next entry, a cancellation or unexpected
   * error propagates immediately. Exhaustion surfaces 429 when any hop was
   * rate-limited, else 502. On primary success the shadow run (if configured
   * and sampled) fires in the background with the SAME dispatch closure.
   */
  private async runRoute(
    dispatch: RouteDispatch,
    options: AiStreamOptions | undefined,
    carriesImage: boolean,
  ): Promise<string> {
    const step = options?.step;
    const entries = this.registry.usableEntriesFor(step, carriesImage);
    if (entries.length === 0) {
      throw this.integrationError(ErrorCode.AiProviderUnavailable);
    }

    let sawRateLimit = false;
    for (const entry of entries) {
      options?.signal?.throwIfAborted();
      const adapter = this.registry.adapterFor(entry.provider);
      if (adapter === undefined) {
        continue;
      }
      try {
        const text = await dispatch(adapter, [entry.model]);
        this.shadow.maybeRun(step, carriesImage, dispatch, options);
        return text;
      } catch (error: unknown) {
        sawRateLimit = sawRateLimit || error instanceof TooManyRequestsError;
        if (!this.isRouteHoppable(error, options)) {
          throw error;
        }
        this.logger.warn(
          `Route entry ${routeEntryKey(entry)} failed for step ${step ?? 'default'}; trying next entry`,
        );
      }
    }

    throw sawRateLimit
      ? new TooManyRequestsError(
          AI_RATE_LIMITED_MESSAGE,
          ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.AiRateLimited],
          ErrorCode.AiRateLimited,
        )
      : this.integrationError(ErrorCode.AiProviderUnavailable);
  }

  /**
   * A failed hop may advance to the next entry only for the recoverable AI
   * error codes; a client cancellation (aborted signal) and any non-AppError
   * (unexpected bug) must propagate immediately.
   */
  private isRouteHoppable(error: unknown, options?: AiStreamOptions): boolean {
    if (options?.signal?.aborted === true) {
      return false;
    }
    if (!(error instanceof AppError)) {
      return false;
    }
    return (ROUTE_HOPPABLE_ERROR_CODES as readonly string[]).includes(error.errorCode);
  }

  private integrationError(errorCode: ErrorCodeValue): IntegrationError {
    return new IntegrationError(
      AI_UNAVAILABLE_MESSAGE,
      ERROR_MESSAGE_KEY_BY_CODE[errorCode],
      errorCode,
    );
  }
}
