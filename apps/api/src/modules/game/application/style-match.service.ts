import { Injectable } from '@nestjs/common';

import type { FinalGameResult, GameStreamStageValue } from '@twinzy/shared';
import { GameStreamStage } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger';
import { CandidateGenerationService, CandidateJudgeService } from '../../ai';
import { ResultAggregationService } from '../../result-aggregation';
import type { StyleMatchInput } from '../model/game-stream.types';

const LOG_CONTEXT = 'StyleMatch';

/**
 * The MULTIMODAL matching phase (visual-similarity mode): receives the photo
 * payload plus the full extraction evidence and produces the final ranked
 * resemblance result localized to the requested language. Generates a
 * worldwide candidate pool, falls back safely when none survive filtering,
 * judges the survivors strictly against the image, then aggregates with the
 * enforced server-side localized disclaimer.
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

  public async matchFromTraits(input: StyleMatchInput): Promise<FinalGameResult> {
    const { extraction, image, languageCode, resultCount, progress, signal } = input;
    this.reportStage(progress, GameStreamStage.GeneratingCandidates);
    const candidates = await this.candidateGeneration.generateCandidates(
      extraction,
      image,
      languageCode,
      resultCount,
      signal,
    );
    if (candidates.length === 0) {
      this.logger.warn('No safe candidates — returning fallback');
      this.reportStage(progress, GameStreamStage.Aggregating);
      return this.resultAggregation.buildFallback(extraction, languageCode, resultCount);
    }

    progress?.onCandidates?.(candidates.map((candidate) => candidate.name));
    this.reportStage(progress, GameStreamStage.Judging);
    const judged = await this.candidateJudge.judgeCandidates({
      extraction,
      candidates,
      image,
      languageCode,
      resultCount,
      signal,
    });
    this.reportStage(progress, GameStreamStage.Aggregating);
    return this.resultAggregation.aggregate(extraction, judged, languageCode, resultCount);
  }

  private reportStage(progress: StyleMatchInput['progress'], stage: GameStreamStageValue): void {
    progress?.onStage?.(stage);
  }
}
