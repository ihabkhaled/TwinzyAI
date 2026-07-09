import { Injectable } from '@nestjs/common';

import type {
  CandidateJudgeResponse,
  FinalGameResult,
  LanguageCodeValue,
  TraitExtractionResponse,
} from '@twinzy/shared';

import { AppLogger } from '../../../core/logger/app-logger.service';
import { selectDisplayableResults } from '../lib/result-aggregation.helpers';
import { toFallbackResult, toFinalGameResult } from '../lib/result-aggregation.mapper';
import { RESULT_AGGREGATION_LOG_CONTEXT } from '../model/result-aggregation.constants';

/**
 * Builds the final API response from judged results:
 * - keeps only displayable, non-weak, sufficiently-scored results
 * - caps at 5, re-ranks 1..n by final score
 * - enforces the SERVER-SIDE localized disclaimer (never trusts model text)
 * - drops the judge's removedCandidates from the public payload
 * - falls back to the server's localized message when nothing survives
 */
@Injectable()
export class ResultAggregationService {
  public constructor(private readonly logger: AppLogger) {
    this.logger.setContext(RESULT_AGGREGATION_LOG_CONTEXT);
  }

  public aggregate(
    extraction: TraitExtractionResponse,
    judgeResponse: CandidateJudgeResponse,
    languageCode: LanguageCodeValue,
    resultCount: number,
  ): FinalGameResult {
    const displayable = selectDisplayableResults(judgeResponse, resultCount);
    this.logger.info(`Aggregated ${displayable.length} final result(s)`);

    if (displayable.length === 0) {
      return this.buildFallback(extraction, languageCode, resultCount);
    }

    return toFinalGameResult(extraction, displayable, languageCode, resultCount);
  }

  public buildFallback(
    extraction: TraitExtractionResponse,
    languageCode: LanguageCodeValue,
    resultCount: number,
  ): FinalGameResult {
    return toFallbackResult(extraction, languageCode, resultCount);
  }
}
