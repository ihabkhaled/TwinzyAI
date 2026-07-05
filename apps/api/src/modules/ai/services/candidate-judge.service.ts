import { Inject, Injectable } from '@nestjs/common';

import type { Candidate, CandidateJudgeResponse, Traits } from '@twinzy/shared';
import { CandidateJudgeResponseSchema } from '@twinzy/shared';

import { LoggerService } from '../../../infrastructure/logger/logger.service';
import type { AiProviderAdapter } from '../interfaces/ai-provider-adapter.interface';
import { AI_PROVIDER_ADAPTER } from '../interfaces/ai-provider-adapter.interface';
import { PromptLoaderService } from '../prompts/prompt-loader.service';
import { PromptKey, PromptPlaceholder } from '../prompts/prompt-version.constant';
import { parseAiJsonResponse } from '../utils/json-response.util';

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
    private readonly promptLoader: PromptLoaderService,
    private readonly aiSafety: AiSafetyService,
    private readonly logger: LoggerService,
  ) {}

  public async judgeCandidates(
    traits: Traits,
    candidates: readonly Candidate[],
  ): Promise<CandidateJudgeResponse> {
    const prompt = this.promptLoader.buildPrompt(PromptKey.CandidateJudge, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify({ traits }, null, 2),
      [PromptPlaceholder.CandidatesJson]: JSON.stringify({ candidates }, null, 2),
    });

    const rawText = await this.aiProvider.generateFromText(prompt);
    const response = parseAiJsonResponse(rawText, CandidateJudgeResponseSchema);

    const safeResults = this.aiSafety.filterJudgedResults(response.results);

    this.logger.log(LOG_CONTEXT, `Judge kept ${safeResults.length} safe result(s)`);
    return { ...response, results: safeResults };
  }
}
