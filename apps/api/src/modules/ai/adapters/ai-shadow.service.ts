import { randomInt } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { type AiRouteEntry, routeEntryKey } from '../../../config/ai-route.types';
import { AppConfigService } from '../../../config/app-config.service';
import type { GeminiStepValue } from '../../../config/gemini-step.constants';
import { AppLogger } from '../../../core/logger/app-logger.service';
import type { AiProviderAdapter, AiStreamOptions } from '../model/ai-provider-adapter.types';
import { SHADOW_SAMPLE_RESOLUTION } from '../model/ai-router.constants';
import type { RouteDispatch } from '../model/ai-router.types';

import { ProviderRegistryService } from './provider-registry.service';

const LOG_CONTEXT = 'AiShadow';

/**
 * Sampled, metrics-only shadow execution: after the primary route has already
 * produced the user's result, the step's shadow entry (if configured, enabled,
 * and sampled in) runs the same TEXT-ONLY call in the background under its own timeout.
 * The outcome is a single structured log line (validity + latency + size);
 * shadow output NEVER touches the user-visible result, and shadow failures are
 * swallowed. Content and images are never logged.
 */
@Injectable()
export class AiShadowService {
  public constructor(
    private readonly config: AppConfigService,
    private readonly registry: ProviderRegistryService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public maybeRun(
    step: GeminiStepValue | undefined,
    execute: RouteDispatch,
    options?: AiStreamOptions,
  ): void {
    if (step === undefined || !this.config.shadowEnabled) {
      return;
    }
    const entry = this.config.shadowRouteFor(step);
    if (entry === undefined || !this.config.isProviderEnabled(entry.provider)) {
      return;
    }
    if (
      randomInt(0, SHADOW_SAMPLE_RESOLUTION) >=
      this.config.shadowSampleRate * SHADOW_SAMPLE_RESOLUTION
    ) {
      return;
    }
    const adapter = this.registry.adapterFor(entry.provider);
    if (adapter === undefined) {
      return;
    }
    // Fire-and-safe: the promise is deliberately detached; every failure path
    // is caught and reduced to a metrics log line.
    void this.runShadow(step, entry, adapter, execute, options);
  }

  private async runShadow(
    step: GeminiStepValue,
    entry: AiRouteEntry,
    adapter: AiProviderAdapter,
    execute: RouteDispatch,
    options?: AiStreamOptions,
  ): Promise<void> {
    const startedAt = Date.now();
    const key = routeEntryKey(entry);
    try {
      const text = await execute(
        adapter,
        [entry.model],
        AbortSignal.timeout(this.config.shadowTimeoutMs),
      );
      const validation = options?.validate?.(text);
      const reasonSuffix =
        validation?.ok === false ? ` reason=${validation.reason ?? 'unknown'}` : '';
      this.logger.info(
        `shadow step=${step} route=${key} ms=${Date.now() - startedAt} chars=${text.length} schemaOk=${validation?.ok ?? 'n/a'}` +
          reasonSuffix,
      );
    } catch {
      this.logger.warn(`shadow step=${step} route=${key} ms=${Date.now() - startedAt} failed`);
    }
  }
}
