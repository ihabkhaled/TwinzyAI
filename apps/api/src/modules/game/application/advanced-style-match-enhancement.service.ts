import { Injectable } from '@nestjs/common';

import type { Candidate, CandidateJudgeResponse, FinalGameResult } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { CandidateJudgeService, CandidateRecallService, mergeCandidatePools } from '../../ai';
import { PublicFigureEnrichmentService } from '../../public-figures';
import type { StyleMatchInput } from '../model/game-stream.types';

@Injectable()
export class AdvancedStyleMatchEnhancementService {
  public constructor(
    private readonly config: AppConfigService,
    private readonly candidateRecall: CandidateRecallService,
    private readonly candidateJudge: CandidateJudgeService,
    private readonly enrichment: PublicFigureEnrichmentService,
  ) {}

  public async retryIfRequested(
    input: StyleMatchInput,
    candidates: readonly Candidate[],
    judged: CandidateJudgeResponse,
  ): Promise<CandidateJudgeResponse> {
    if (!this.shouldRetry(judged)) {
      return judged;
    }
    const secondPool = await this.recallSecondPool(input, judged.suggestedSearchTags ?? []);
    return this.judgeCombined(input, candidates, secondPool);
  }

  private recallSecondPool(
    input: StyleMatchInput,
    suggestedSearchTags: readonly string[],
  ): Promise<Candidate[]> {
    return this.candidateRecall.recall({
      extraction: input.extraction,
      languageCode: input.languageCode,
      resultCount: input.resultCount,
      signal: input.signal,
      suggestedSearchTags,
    });
  }

  private judgeCombined(
    input: StyleMatchInput,
    candidates: readonly Candidate[],
    secondPool: readonly Candidate[],
  ): Promise<CandidateJudgeResponse> {
    return this.candidateJudge.judgeCandidates({
      extraction: input.extraction,
      candidates: mergeCandidatePools([candidates, secondPool]),
      languageCode: input.languageCode,
      resultCount: input.resultCount,
      signal: input.signal,
    });
  }

  public async enrich(result: FinalGameResult): Promise<FinalGameResult> {
    const results = await Promise.all(
      result.results.map(async (item) => {
        if (item.entityId === undefined) {
          return item;
        }
        const publicFigure = await this.enrichment.enrich(item.entityId, result.languageCode);
        return publicFigure === undefined ? item : { ...item, publicFigure };
      }),
    );
    return { ...result, results };
  }

  private shouldRetry(judged: CandidateJudgeResponse): boolean {
    return (
      this.config.advancedMatching.secondRetrievalPassEnabled &&
      judged.requiresSecondRetrievalPass === true &&
      (judged.suggestedSearchTags?.length ?? 0) > 0
    );
  }
}
