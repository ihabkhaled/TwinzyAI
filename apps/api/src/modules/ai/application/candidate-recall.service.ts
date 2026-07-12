import { Injectable } from '@nestjs/common';

import type { Candidate } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { GeminiStep } from '../../../config/gemini-step.constants';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { buildCandidateGenerationLanes } from '../lib/candidate-lane-plan.util';
import { mergeCandidatePools } from '../lib/candidate-merge.util';
import { RESERVED_NON_GENERATION_CALLS } from '../model/candidate-lane.constants';
import type { CandidateGenerationLane } from '../model/candidate-lane.types';
import type { CandidateRecallInput } from '../model/candidate-recall.types';

import { AiStepConcurrencyGate } from './ai-step-concurrency.gate';
import { CandidateGenerationService } from './candidate-generation.service';

const LOG_CONTEXT = 'CandidateRecall';

/**
 * TEXT-ONLY candidate recall — the single entry point the matching phase calls.
 * Owns the single-vs-parallel strategy: with the parallel flag OFF it makes the
 * one unchanged generation call; with it ON (Release A) it fans out into focus
 * lanes, each a separate text-only provider call, bounded globally by the
 * generation concurrency gate and clamped to the per-analysis call budget, then
 * deterministically merges the pools. One failed/timed-out lane never fails the
 * analysis; an empty merge lets the caller fall back exactly as the single-call
 * path does. The photo cannot reach here: recall receives only written traits.
 */
@Injectable()
export class CandidateRecallService {
  public constructor(
    private readonly candidateGeneration: CandidateGenerationService,
    private readonly gate: AiStepConcurrencyGate,
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public recall(input: CandidateRecallInput): Promise<Candidate[]> {
    if (!this.config.aiParallelPipelineEnabled) {
      return this.candidateGeneration.generateCandidates(
        input.extraction,
        input.languageCode,
        input.resultCount,
        input.signal,
      );
    }
    return this.fanOut(input);
  }

  private async fanOut(input: CandidateRecallInput): Promise<Candidate[]> {
    const lanes = buildCandidateGenerationLanes(this.resolveLaneCount());
    const settled = await Promise.allSettled(lanes.map((lane) => this.runLane(input, lane)));
    const pools = this.collectPools(settled, lanes);
    const merged = mergeCandidatePools(pools);
    this.logger.info(
      `Parallel recall: ${lanes.length} lane(s), ${pools.length} succeeded, ${merged.length} merged candidate(s)`,
    );
    return merged;
  }

  /**
   * Configured lane count, clamped so total provider calls (extraction +
   * lanes + judge) can never exceed AI_MAX_CALLS_PER_ANALYSIS. Always ≥ 1.
   */
  private resolveLaneCount(): number {
    const budgetedLanes = Math.max(
      1,
      this.config.aiMaxCallsPerAnalysis - RESERVED_NON_GENERATION_CALLS,
    );
    const configured = this.config.aiGenerationLanes;
    const laneCount = Math.min(configured, budgetedLanes);
    if (laneCount < configured) {
      this.logger.warn(
        `Generation lanes clamped ${configured} -> ${laneCount} by AI_MAX_CALLS_PER_ANALYSIS budget`,
      );
    }
    return laneCount;
  }

  private runLane(
    input: CandidateRecallInput,
    lane: CandidateGenerationLane,
  ): Promise<Candidate[]> {
    return this.gate.run(
      GeminiStep.Generation,
      () =>
        this.candidateGeneration.generateCandidates(
          input.extraction,
          input.languageCode,
          input.resultCount,
          input.signal,
          lane,
        ),
      { signal: input.signal, timeoutMs: this.config.aiParallelQueueTimeoutMs },
    );
  }

  /** Keep successful lane pools; log each failure by type only (never detail). */
  private collectPools(
    settled: readonly PromiseSettledResult<Candidate[]>[],
    lanes: readonly CandidateGenerationLane[],
  ): Candidate[][] {
    const pools: Candidate[][] = [];
    for (const [index, outcome] of settled.entries()) {
      if (outcome.status === 'fulfilled') {
        pools.push(outcome.value);
        continue;
      }
      const reason = outcome.reason instanceof Error ? outcome.reason.name : 'unknown';
      this.logger.warn(`Generation lane ${lanes[index]?.id ?? String(index)} failed: ${reason}`);
    }
    return pools;
  }
}
