import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import {
  AiProvider,
  type AiProviderValue,
  OPENAI_COMPAT_PROVIDER_VALUES,
} from '../../../config/ai-provider.constants';
import { type AiRouteEntry, routeEntryKey } from '../../../config/ai-route.types';
import { AppConfigService } from '../../../config/app-config.service';
import {
  AI_IMAGE_STEPS,
  GeminiStep,
  type GeminiStepValue,
} from '../../../config/gemini-step.constants';
import { AppLogger } from '../../../core/logger/app-logger.service';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';

import { GeminiAdapter } from './gemini.adapter';
import { OpenAiCompatAdapter } from './openai-compat.adapter';

const LOG_CONTEXT = 'ProviderRegistry';

/**
 * Owns the provider-id → adapter map and validates the routing configuration
 * at boot (fail fast, not on a user's request). Gemini is always registered;
 * each OpenAI-compatible provider is instantiated only when its API key is
 * configured — an unconfigured provider simply does not exist at runtime.
 *
 * Validation asymmetry, by design: an EXPLICIT `AI_ROUTE_<STEP>` that resolves
 * to zero usable entries is a configuration error and boot throws; a legacy /
 * implicit route with zero usable entries (e.g. CI boots with no GEMINI_API_KEY
 * and adapter test-doubles) only logs a warning, preserving today's behavior.
 */
@Injectable()
export class ProviderRegistryService implements OnModuleInit {
  private readonly adapters = new Map<AiProviderValue, AiProviderAdapter>();

  public constructor(
    private readonly geminiAdapter: GeminiAdapter,
    private readonly config: AppConfigService,
    private readonly moduleRef: ModuleRef,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async onModuleInit(): Promise<void> {
    this.adapters.set(AiProvider.Gemini, this.geminiAdapter);
    for (const provider of OPENAI_COMPAT_PROVIDER_VALUES) {
      if (!this.config.isProviderEnabled(provider)) {
        continue;
      }

      const adapterLogger = await this.moduleRef.resolve(AppLogger);
      this.adapters.set(provider, new OpenAiCompatAdapter(provider, this.config, adapterLogger));
      this.logger.info(`Provider enabled: ${provider}`);
    }
    this.validateRouting();
  }

  public adapterFor(provider: AiProviderValue): AiProviderAdapter | undefined {
    return this.adapters.get(provider);
  }

  /**
   * Route entries for a step that are actually dispatchable right now:
   * provider enabled, and vision-capable when the call carries the photo.
   * Calls without a step ride the global Gemini chain (legacy behavior).
   */
  public usableEntriesFor(
    step: GeminiStepValue | undefined,
    carriesImage: boolean,
  ): readonly AiRouteEntry[] {
    const resolved: readonly AiRouteEntry[] =
      step === undefined
        ? this.config.geminiModelChainFor().map((model) => ({ provider: AiProvider.Gemini, model }))
        : this.config.aiRouteFor(step);
    return resolved.filter(
      (entry) =>
        this.config.isProviderEnabled(entry.provider) &&
        (!carriesImage || this.config.isVisionCapable(entry)),
    );
  }

  /**
   * Boot-time routing validation: every route/shadow declaration must parse,
   * and an explicit step route must keep at least one usable entry (vision
   * capable for image steps). Throws a readable error on violations.
   */
  private validateRouting(): void {
    const imageSteps: readonly GeminiStepValue[] = AI_IMAGE_STEPS;
    for (const step of Object.values(GeminiStep)) {
      // Shadow route must parse even when unused (throws on bad syntax).
      this.config.shadowRouteFor(step);

      const carriesImage = imageSteps.includes(step);
      const usable = this.usableEntriesFor(step, carriesImage);
      if (usable.length > 0) {
        this.logger.info(
          `Step ${step} route: ${usable.map((entry) => routeEntryKey(entry)).join(' -> ')}`,
        );
        continue;
      }
      const message = `Step ${step} has no usable route entry (enabled${carriesImage ? ' + vision-capable' : ''})`;
      if (this.config.hasExplicitAiRoute(step)) {
        throw new Error(`${message} — fix AI_ROUTE_${step.toUpperCase()} or enable its provider`);
      }
      this.logger.warn(`${message}; calls will fail until a provider key is configured`);
    }
  }
}
