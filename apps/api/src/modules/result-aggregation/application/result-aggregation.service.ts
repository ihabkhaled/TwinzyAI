import { Injectable } from '@nestjs/common';

import type { CandidateJudgeResponse, FinalGameResult, Traits } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger/app-logger.service';
import { selectDisplayableResults } from '../lib/result-aggregation.helpers';
import { toFallbackResult, toFinalGameResult } from '../lib/result-aggregation.mapper';
import { RESULT_AGGREGATION_LOG_CONTEXT } from '../model/result-aggregation.constants';

/**
 * Builds the final API response from judged results:
 * - keeps only displayable, non-weak, sufficiently-scored results
 * - caps at 4, re-ranks 1..n by final score
 * - enforces the fixed disclaimer server-side (never trusts model text)
 * - falls back to a friendly message when nothing survives
 */
@Injectable()
export class ResultAggregationService {
  public constructor(private readonly logger: AppLogger) {
    this.logger.setContext(RESULT_AGGREGATION_LOG_CONTEXT);
  }

  public aggregate(traits: Traits, judgeResponse: CandidateJudgeResponse): FinalGameResult {
    const displayable = selectDisplayableResults(judgeResponse);
    this.logger.info(`Aggregated ${displayable.length} final result(s)`);

    if (displayable.length === 0) {
      return this.buildFallback(traits);
    }

    return toFinalGameResult(traits, displayable);
  }

  public buildFallback(traits: Traits): FinalGameResult {
    return toFallbackResult(traits);
  }
}
