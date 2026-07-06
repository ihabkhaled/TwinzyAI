import { Inject, Injectable } from '@nestjs/common';

import type { Candidate, CandidateJudgeResponse, Traits } from '@twinzy/shared';
import { CandidateJudgeResponseSchema } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger/app-logger.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { parseAiJsonResponse } from '../lib/json-response.util';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';
import { AI_PROVIDER_ADAPTER } from '../model/ai-provider-adapter.types';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';

import { AiSafetyService } from './ai-safety.service';

const LOG_CONTEXT = 'CandidateJudge';

/**
 * TEXT-ONLY judge step: receives written traits + the candidate JSON,
 * re-scores, filters weak/unsafe entries, and returns the final safe set.
 * Never sees the image by construction.
 */
@Injectable()
export class CandidateJudgeService {
  public constructor(
    @Inject(AI_PROVIDER_ADAPTER) private readonly aiProvider: AiProviderAdapter,
    private readonly promptTemplate: PromptTemplateRepository,
    private readonly aiSafety: AiSafetyService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async judgeCandidates(
    traits: Traits,
    candidates: readonly Candidate[],
  ): Promise<CandidateJudgeResponse> {
    const prompt = this.promptTemplate.buildPrompt(PromptKey.CandidateJudge, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify({ traits }, null, 2),
      [PromptPlaceholder.CandidatesJson]: JSON.stringify({ candidates }, null, 2),
    });

    const rawText = await this.aiProvider.generateFromTextStream(prompt);
    const response = parseAiJsonResponse(rawText, CandidateJudgeResponseSchema);

    const safeResults = this.aiSafety.filterJudgedResults(response.results);

    this.logger.info(`Judge kept ${safeResults.length} safe result(s)`);
    return { ...response, results: safeResults };
  }
}
