import { Inject, Injectable } from '@nestjs/common';

import type { Candidate, Traits } from '@twinzy/shared';
import { CandidateGenerationResponseSchema } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger/app-logger.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { parseAiJsonResponse } from '../lib/json-response.util';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';
import { AI_PROVIDER_ADAPTER } from '../model/ai-provider-adapter.types';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';

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
    private readonly promptTemplate: PromptTemplateRepository,
    private readonly aiSafety: AiSafetyService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async generateCandidates(traits: Traits): Promise<Candidate[]> {
    const prompt = this.promptTemplate.buildPrompt(PromptKey.CandidateGeneration, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify({ traits }, null, 2),
    });

    const rawText = await this.aiProvider.generateFromTextStream(prompt);
    const response = parseAiJsonResponse(rawText, CandidateGenerationResponseSchema);

    const safeCandidates = this.aiSafety.filterCandidates(response.candidates);
    const ranked = safeCandidates.toSorted((a, b) => b.styleVibeFitScore - a.styleVibeFitScore);

    this.logger.info(`Generated ${ranked.length} safe candidate(s)`);
    return ranked;
  }
}
