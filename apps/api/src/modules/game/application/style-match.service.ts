import { Injectable } from '@nestjs/common';

import type {
  Candidate,
  CandidateJudgeResponse,
  FinalGameResult,
  GameStreamStageValue,
} from '@twinzy/shared';
import { GameStreamStage } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger';
import { CandidateGenerationService, CandidateJudgeService } from '../../ai';
import { ResultAggregationService } from '../../result-aggregation';
import type { StyleMatchInput } from '../model/game-stream.types';

const LOG_CONTEXT = 'StyleMatch';

/**
 * The TEXT-ONLY matching phase. By the time this runs the image is destroyed:
 * it receives written extraction evidence, builds a worldwide candidate pool,
 * judges survivors conservatively, and aggregates the localized result with
 * the enforced server-side disclaimer.
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
    const { extraction, languageCode, resultCount, progress } = input;
    const candidates = await this.generateCandidates(input);
    if (candidates.length === 0) {
      this.logger.warn('No safe candidates — returning fallback');
      this.reportStage(progress, GameStreamStage.Aggregating);
      return this.resultAggregation.buildFallback(extraction, languageCode, resultCount);
    }

    const judged = await this.judgeCandidates(input, candidates);
    this.reportStage(progress, GameStreamStage.Aggregating);
    return this.resultAggregation.aggregate(extraction, judged, languageCode, resultCount);
  }

  private generateCandidates(input: StyleMatchInput): Promise<Candidate[]> {
    this.reportStage(input.progress, GameStreamStage.GeneratingCandidates);
    return this.candidateGeneration.generateCandidates(
      input.extraction,
      input.languageCode,
      input.resultCount,
      input.signal,
    );
  }

  private judgeCandidates(
    input: StyleMatchInput,
    candidates: readonly Candidate[],
  ): Promise<CandidateJudgeResponse> {
    input.progress?.onCandidates?.(candidates.map((candidate) => candidate.name));
    this.reportStage(input.progress, GameStreamStage.Judging);
    return this.candidateJudge.judgeCandidates({
      extraction: input.extraction,
      candidates,
      languageCode: input.languageCode,
      resultCount: input.resultCount,
      signal: input.signal,
    });
  }

  private reportStage(progress: StyleMatchInput['progress'], stage: GameStreamStageValue): void {
    progress?.onStage?.(stage);
  }
}
