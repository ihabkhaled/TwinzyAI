import { Injectable, Optional } from '@nestjs/common';

import type {
  Candidate,
  CandidateJudgeResponse,
  FinalGameResult,
  GameStreamStageValue,
} from '@twinzy/shared';
import { GameStreamStage } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger';
import { CandidateJudgeService, CandidateRecallService } from '../../ai';
import { ResultAggregationService } from '../../result-aggregation';
import type { StyleMatchInput } from '../model/game-stream.types';

import { AdvancedStyleMatchEnhancementService } from './advanced-style-match-enhancement.service';

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
    private readonly candidateRecall: CandidateRecallService,
    private readonly candidateJudge: CandidateJudgeService,
    private readonly resultAggregation: ResultAggregationService,
    private readonly logger: AppLogger,
    @Optional()
    private readonly advancedEnhancement?: AdvancedStyleMatchEnhancementService,
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
    return this.matchCandidates(input, candidates);
  }

  private async matchCandidates(
    input: StyleMatchInput,
    candidates: readonly Candidate[],
  ): Promise<FinalGameResult> {
    const firstJudgment = await this.judgeCandidates(input, candidates);
    const judged =
      (await this.advancedEnhancement?.retryIfRequested(input, candidates, firstJudgment)) ??
      firstJudgment;
    this.reportStage(input.progress, GameStreamStage.Aggregating);
    const result = this.resultAggregation.aggregate(
      input.extraction,
      judged,
      input.languageCode,
      input.resultCount,
    );
    return (await this.advancedEnhancement?.enrich(result)) ?? result;
  }

  /**
   * Recall the candidate pool. The recall service owns the single-vs-parallel
   * strategy behind the flag; either way it reports the same public
   * `generating-candidates` stage, so the SSE contract is identical.
   */
  private generateCandidates(input: StyleMatchInput): Promise<Candidate[]> {
    this.reportStage(input.progress, GameStreamStage.GeneratingCandidates);
    return this.candidateRecall.recall({
      extraction: input.extraction,
      languageCode: input.languageCode,
      resultCount: input.resultCount,
      signal: input.signal,
    });
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
