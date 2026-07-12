import { Inject, Injectable } from '@nestjs/common';

import type {
  Candidate,
  CandidateGenerationResponse,
  LanguageCodeValue,
  TraitExtractionResponse,
} from '@twinzy/shared';
import { CandidateGenerationResponseSchema, PROMPT_JSON_INDENT } from '@twinzy/shared';

import { GeminiStep } from '../../../config/gemini-step.constants';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { buildLaneFocusSection } from '../lib/candidate-lane-plan.util';
import { buildSchemaValidator, parseAiJsonResponse } from '../lib/json-response.util';
import { buildMatchingEvidence } from '../lib/matching-evidence.util';
import { assertResponseLanguage } from '../lib/response-language.guard';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';
import { AI_PROVIDER_ADAPTER } from '../model/ai-provider-adapter.types';
import type { CandidateGenerationLane } from '../model/candidate-lane.types';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';
import { REGION_HINT_BY_LANGUAGE } from '../model/region-hint.constants';

import { AiSafetyService } from './ai-safety.service';

const LOG_CONTEXT = 'CandidateGeneration';

/**
 * TEXT-ONLY recall step: receives the full distilled written matching evidence
 * (traits, compact summary, weighted evidence, archetype/search hints, and
 * image-quality caps) and returns a worldwide public style/vibe candidate pool.
 * The provider method has no image slot, so the photo cannot cross this
 * boundary. Unsafe candidates are dropped; the caller handles an empty result.
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

  /**
   * Generate a text-only candidate pool. When `lane` is provided (parallel
   * mode) a text-only recall-focus section is appended to the prompt; when it
   * is absent (single-call / flag-off mode) the prompt is byte-for-byte the
   * unchanged base template.
   */
  public async generateCandidates(
    extraction: TraitExtractionResponse,
    languageCode: LanguageCodeValue,
    resultCount: number,
    signal?: AbortSignal,
    lane?: CandidateGenerationLane,
  ): Promise<Candidate[]> {
    const prompt = this.buildPrompt(extraction, languageCode, resultCount, lane);
    const rawText = await this.aiProvider.generateFromTextStream(prompt, {
      signal,
      validate: buildSchemaValidator(CandidateGenerationResponseSchema),
      step: GeminiStep.Generation,
    });
    const response = this.parseResponse(rawText);
    assertResponseLanguage(response.languageCode, languageCode);
    const safeCandidates = this.aiSafety.filterCandidates(response.candidates);
    const ranked = safeCandidates.toSorted((a, b) => b.styleVibeFitScore - a.styleVibeFitScore);
    this.logGenerated(ranked.length, lane);
    return ranked;
  }

  private logGenerated(count: number, lane?: CandidateGenerationLane): void {
    const laneSuffix = lane === undefined ? '' : ` (${lane.id})`;
    this.logger.info(`Generated ${count} safe candidate(s)${laneSuffix}`);
  }

  private buildPrompt(
    extraction: TraitExtractionResponse,
    languageCode: LanguageCodeValue,
    resultCount: number,
    lane?: CandidateGenerationLane,
  ): string {
    const base = this.promptTemplate.buildPrompt(PromptKey.CandidateGeneration, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify(
        buildMatchingEvidence(extraction),
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.LanguageCode]: languageCode,
      [PromptPlaceholder.ResultCount]: String(resultCount),
      [PromptPlaceholder.RegionHint]: REGION_HINT_BY_LANGUAGE[languageCode],
    });
    return lane === undefined ? base : `${base}${buildLaneFocusSection(lane)}`;
  }

  private parseResponse(rawText: string): CandidateGenerationResponse {
    return parseAiJsonResponse(rawText, CandidateGenerationResponseSchema, (issues) => {
      this.logger.warn(`Candidate response schema mismatch: ${issues}`);
    });
  }
}
