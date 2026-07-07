import { Inject, Injectable } from '@nestjs/common';

import type { Candidate, LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';
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
 * TEXT-ONLY step: receives the written advanced traits + compact summary
 * (never the image, never a hash or crop of it — the adapter method
 * signature has no image slot) and returns up to 5 playful GLOBAL public
 * style/vibe candidates localized to the requested language. A response with
 * more than 5 candidates fails schema validation (documented decision).
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

  public async generateCandidates(
    extraction: TraitExtractionResponse,
    languageCode: LanguageCodeValue,
  ): Promise<Candidate[]> {
    const prompt = this.promptTemplate.buildPrompt(PromptKey.CandidateGeneration, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify(
        { traits: extraction.traits, compactTraitSummary: extraction.compactTraitSummary },
        null,
        2,
      ),
      [PromptPlaceholder.LanguageCode]: languageCode,
    });

    const rawText = await this.aiProvider.generateFromTextStream(prompt);
    const response = parseAiJsonResponse(rawText, CandidateGenerationResponseSchema, (issues) => {
      this.logger.warn(`Candidate response schema mismatch: ${issues}`);
    });

    const safeCandidates = this.aiSafety.filterCandidates(response.candidates);
    const ranked = safeCandidates.toSorted((a, b) => b.styleVibeFitScore - a.styleVibeFitScore);

    this.logger.info(`Generated ${ranked.length} safe candidate(s)`);
    return ranked;
  }
}
