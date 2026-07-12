import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import { GeminiStep, type GeminiStepValue } from '../../../config/gemini-step.constants';
import { Semaphore, type SemaphoreAcquireOptions } from '../../../core/concurrency';

/**
 * Process-global concurrency gate for AI pipeline steps. Holds one long-lived
 * {@link Semaphore} per gated step (generation now; judge is provisioned for
 * the Release B judge tournament) so that, no matter how many analyses fan out
 * at once, the number of concurrent provider calls for a step never exceeds
 * its configured ceiling. Steps with no semaphore (extraction, translation)
 * pass straight through — they are single calls and need no gating.
 *
 * Single-instance, in-memory: it bounds one API instance. Fleet-wide bounding
 * is a horizontal-scaling concern handled by per-instance sizing.
 */
@Injectable()
export class AiStepConcurrencyGate {
  private readonly semaphores: Map<GeminiStepValue, Semaphore>;

  public constructor(private readonly config: AppConfigService) {
    this.semaphores = new Map<GeminiStepValue, Semaphore>([
      [GeminiStep.Generation, new Semaphore(this.config.aiGenerationConcurrency)],
      [GeminiStep.Judge, new Semaphore(this.config.aiJudgeConcurrency)],
    ]);
  }

  /**
   * Run `task` while holding one permit for `step`. Waits (up to the caller's
   * timeout/abort budget) for a permit, runs the task, and always releases the
   * permit. Rejects — without running the task — when the wait aborts or times
   * out, or when the signal is already aborted at run time.
   */
  public async run<TResult>(
    step: GeminiStepValue,
    task: () => Promise<TResult>,
    options?: SemaphoreAcquireOptions,
  ): Promise<TResult> {
    const semaphore = this.semaphores.get(step);
    if (semaphore === undefined) {
      return task();
    }
    const release = await semaphore.acquire(options);
    try {
      options?.signal?.throwIfAborted();
      return await task();
    } finally {
      release();
    }
  }

  /** Permits currently free for a step (test/observability aid). */
  public availablePermits(step: GeminiStepValue): number | undefined {
    return this.semaphores.get(step)?.availablePermits;
  }
}
