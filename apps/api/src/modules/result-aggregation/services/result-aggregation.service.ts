import { Injectable } from '@nestjs/common';

import type { CandidateJudgeResponse, FinalGameResult, JudgedResult, Traits } from '@twinzy/shared';
import {
  MAX_FINAL_RESULTS,
  MIN_DISPLAY_SCORE,
  NO_MATCH_FALLBACK_MESSAGE,
  RESULT_DISCLAIMER,
  Verdict,
} from '@twinzy/shared';

import { LoggerService } from '../../../infrastructure/logger/logger.service';

const LOG_CONTEXT = 'ResultAggregation';

/**
 * Builds the final API response from judged results:
 * - keeps only displayable, non-weak, sufficiently-scored results
 * - caps at 4, re-ranks 1..n by final score
 * - enforces the fixed disclaimer server-side (never trusts model text)
 * - falls back to a friendly message when nothing survives
 */
@Injectable()
export class ResultAggregationService {
  public constructor(private readonly logger: LoggerService) {}

  public aggregate(traits: Traits, judgeResponse: CandidateJudgeResponse): FinalGameResult {
    const displayable = judgeResponse.results
      .filter((result) => this.isDisplayable(result))
      .toSorted((a, b) => b.finalStyleVibeFitScore - a.finalStyleVibeFitScore)
      .slice(0, MAX_FINAL_RESULTS);

    this.logger.log(LOG_CONTEXT, `Aggregated ${displayable.length} final result(s)`);

    if (displayable.length === 0) {
      return this.buildFallback(traits);
    }

    return {
      traits,
      results: displayable.map((result, index) => ({
        name: result.name,
        rank: index + 1,
        finalStyleVibeFitScore: result.finalStyleVibeFitScore,
        verdict: result.verdict,
        reason: result.reason,
        matchingTraits: result.matchingTraits,
        weakOrUncertainTraits: result.weakOrUncertainTraits,
      })),
      fallbackMessage: '',
      disclaimer: RESULT_DISCLAIMER,
    };
  }

  public buildFallback(traits: Traits): FinalGameResult {
    return {
      traits,
      results: [],
      fallbackMessage: NO_MATCH_FALLBACK_MESSAGE,
      disclaimer: RESULT_DISCLAIMER,
    };
  }

  private isDisplayable(result: JudgedResult): boolean {
    return (
      result.shouldDisplay &&
      result.verdict !== Verdict.Weak &&
      result.finalStyleVibeFitScore >= MIN_DISPLAY_SCORE
    );
  }
}
