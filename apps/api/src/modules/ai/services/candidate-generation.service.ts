import { Inject, Injectable } from '@nestjs/common';

import type { Candidate, Traits } from '@twinzy/shared';
import { CandidateGenerationResponseSchema } from '@twinzy/shared';

import { LoggerService } from '../../../infrastructure/logger/logger.service';
import type { AiProviderAdapter } from '../interfaces/ai-provider-adapter.interface';
import { AI_PROVIDER_ADAPTER } from '../interfaces/ai-provider-adapter.interface';
import { PromptLoaderService } from '../prompts/prompt-loader.service';
import { PromptKey, PromptPlaceholder } from '../prompts/prompt-version.constant';
import { parseAiJsonResponse } from '../utils/json-response.util';

import { AiSafetyService } from './ai-safety.service';

const LOG_CONTEXT = 'CandidateGeneration';

/**
 * TEXT-ONLY step: receives the written traits (never the image, never a
 * hash or crop of it — the adapter method signature has no image slot) and
 * returns 1-5 playful public style/vibe candidates. A response with more
 * than 5 candidates fails schema validation (documented decision).
 * Unsafe candidates are dropped; the caller handles an empty remainder.
 */
@Injectable()
export class CandidateGenerationService {
  public constructor(
    @Inject(AI_PROVIDER_ADAPTER) private readonly aiProvider: AiProviderAdapter,
    private readonly promptLoader: PromptLoaderService,
    private readonly aiSafety: AiSafetyService,
    private readonly logger: LoggerService,
  ) {}

  public async generateCandidates(traits: Traits): Promise<Candidate[]> {
    const prompt = this.promptLoader.buildPrompt(PromptKey.CandidateGeneration, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify({ traits }, null, 2),
    });

    const rawText = await this.aiProvider.generateFromText(prompt);
    const response = parseAiJsonResponse(rawText, CandidateGenerationResponseSchema);

    const safeCandidates = this.aiSafety.filterCandidates(response.candidates);
    const ranked = safeCandidates.toSorted((a, b) => b.styleVibeFitScore - a.styleVibeFitScore);

    this.logger.log(LOG_CONTEXT, `Generated ${ranked.length} safe candidate(s)`);
    return ranked;
  }
}
