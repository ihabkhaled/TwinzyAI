import { Injectable } from '@nestjs/common';

import type { FinalGameResult, Traits } from '@twinzy/shared';
import { GameStreamStage } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger';
import { CandidateGenerationService, CandidateJudgeService } from '../../ai';
import { ResultAggregationService } from '../../result-aggregation';
import type { StyleMatchProgressListener } from '../model/game-stream.types';

const LOG_CONTEXT = 'StyleMatch';

/**
 * The TEXT-ONLY matching phase of the analyze pipeline. By the time this runs
 * the image is already gone: it receives only the written traits and produces
 * the final ranked style/vibe result. Generates candidates, falls back safely
 * when none survive filtering, judges the survivors, then aggregates with the
 * enforced server-side disclaimer.
 */
@Injectable()
export class StyleMatchService {
  public constructor(
    private readonly candidateGeneration: CandidateGenerationService,
    private readonly candidateJudge: CandidateJudgeService,
    private readonly resultAggregation: ResultAggregationService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async matchFromTraits(
    traits: Traits,
    progress?: StyleMatchProgressListener,
  ): Promise<FinalGameResult> {
    progress?.onStage?.(GameStreamStage.GeneratingCandidates);
    const candidates = await this.candidateGeneration.generateCandidates(traits);
    if (candidates.length === 0) {
      this.logger.warn('No safe candidates — returning fallback');
      progress?.onStage?.(GameStreamStage.Aggregating);
      return this.resultAggregation.buildFallback(traits);
    }

    progress?.onCandidates?.(candidates.map((candidate) => candidate.name));
    progress?.onStage?.(GameStreamStage.Judging);
    const judged = await this.candidateJudge.judgeCandidates(traits, candidates);
    progress?.onStage?.(GameStreamStage.Aggregating);
    return this.resultAggregation.aggregate(traits, judged);
  }
}
