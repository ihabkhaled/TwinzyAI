import { Injectable } from '@nestjs/common';

import type { FinalGameResult, LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';
import { GameStreamStage } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger';
import { CandidateGenerationService, CandidateJudgeService } from '../../ai';
import { ResultAggregationService } from '../../result-aggregation';
import type { StyleMatchProgressListener } from '../model/game-stream.types';

const LOG_CONTEXT = 'StyleMatch';

/**
 * The TEXT-ONLY matching phase of the analyze pipeline. By the time this runs
 * the image is already gone: it receives only the written advanced traits and
 * produces the final ranked style/vibe result localized to the requested
 * language. Generates global candidates, falls back safely when none survive
 * filtering, judges the survivors strictly, then aggregates with the enforced
 * server-side localized disclaimer.
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
    extraction: TraitExtractionResponse,
    languageCode: LanguageCodeValue,
    resultCount: number,
    progress?: StyleMatchProgressListener,
    signal?: AbortSignal,
  ): Promise<FinalGameResult> {
    progress?.onStage?.(GameStreamStage.GeneratingCandidates);
    const candidates = await this.candidateGeneration.generateCandidates(
      extraction,
      languageCode,
      resultCount,
      signal,
    );
    if (candidates.length === 0) {
      this.logger.warn('No safe candidates — returning fallback');
      progress?.onStage?.(GameStreamStage.Aggregating);
      return this.resultAggregation.buildFallback(extraction, languageCode, resultCount);
    }

    progress?.onCandidates?.(candidates.map((candidate) => candidate.name));
    progress?.onStage?.(GameStreamStage.Judging);
    const judged = await this.candidateJudge.judgeCandidates(
      extraction.traits,
      candidates,
      languageCode,
      resultCount,
      signal,
    );
    progress?.onStage?.(GameStreamStage.Aggregating);
    return this.resultAggregation.aggregate(extraction, judged, languageCode, resultCount);
  }
}
