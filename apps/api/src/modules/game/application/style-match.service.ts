import { Injectable } from '@nestjs/common';

import type { FinalGameResult, Traits } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger';
import { CandidateGenerationService, CandidateJudgeService } from '../../ai';
import { ResultAggregationService } from '../../result-aggregation';

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

  public async matchFromTraits(traits: Traits): Promise<FinalGameResult> {
    const candidates = await this.candidateGeneration.generateCandidates(traits);
    if (candidates.length === 0) {
      this.logger.warn('No safe candidates — returning fallback');
      return this.resultAggregation.buildFallback(traits);
    }

    const judged = await this.candidateJudge.judgeCandidates(traits, candidates);
    return this.resultAggregation.aggregate(traits, judged);
  }
}
