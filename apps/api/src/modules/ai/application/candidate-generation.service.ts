import { Inject, Injectable } from '@nestjs/common';

import type { Candidate, LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';
import { CandidateGenerationResponseSchema, PROMPT_JSON_INDENT } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger/app-logger.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { buildSchemaValidator, parseAiJsonResponse } from '../lib/json-response.util';
import { buildMatchingEvidence } from '../lib/matching-evidence.util';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';
import { AI_PROVIDER_ADAPTER } from '../model/ai-provider-adapter.types';
import type { AiImageInput } from '../model/gemini.types';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';

import { AiSafetyService } from './ai-safety.service';

const LOG_CONTEXT = 'CandidateGeneration';

/**
 * MULTIMODAL recall step (visual-similarity mode): receives the photo plus the
 * full distilled matching evidence (traits, compact summary, weighted evidence,
 * archetype/search hints, image-quality caps) and returns a worldwide candidate
 * pool of public figures who visually resemble the person, localized to the
 * requested language. Pool size is schema-bounded relative to resultCount.
 * Unsafe candidates are dropped; the caller handles an empty remainder. The
 * image payload is never logged and never persisted (policy — see CLAUDE.md).
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
    image: AiImageInput,
    languageCode: LanguageCodeValue,
    resultCount: number,
    signal?: AbortSignal,
  ): Promise<Candidate[]> {
    const prompt = this.promptTemplate.buildPrompt(PromptKey.CandidateGeneration, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify(
        buildMatchingEvidence(extraction),
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.LanguageCode]: languageCode,
      [PromptPlaceholder.ResultCount]: String(resultCount),
    });

    const rawText = await this.aiProvider.generateFromImageStream(
      prompt,
      image,
      undefined,
      signal,
      buildSchemaValidator(CandidateGenerationResponseSchema),
    );
    const response = parseAiJsonResponse(rawText, CandidateGenerationResponseSchema, (issues) => {
      this.logger.warn(`Candidate response schema mismatch: ${issues}`);
    });

    const safeCandidates = this.aiSafety.filterCandidates(response.candidates);
    const ranked = safeCandidates.toSorted((a, b) => b.styleVibeFitScore - a.styleVibeFitScore);

    this.logger.info(`Generated ${ranked.length} safe candidate(s)`);
    return ranked;
  }
}
