import { Inject, Injectable } from '@nestjs/common';

import type { LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';
import { countPopulatedTraitFields, isRecord, TraitExtractionResponseSchema } from '@twinzy/shared';

import { GeminiStep } from '../../../config/gemini-step.constants';
import { buildIntegrationError, ErrorCode } from '../../../core/errors';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { buildSchemaValidator, parseAiJsonResponse } from '../lib/json-response.util';
import { collectExtractionTextValues } from '../lib/trait-text.util';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';
import { AI_PROVIDER_ADAPTER } from '../model/ai-provider-adapter.types';
import { AI_INVALID_RESPONSE_MESSAGE } from '../model/gemini.constants';
import type { AiImageInput } from '../model/gemini.types';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';

import { AiSafetyService } from './ai-safety.service';

const LOG_CONTEXT = 'TraitExtraction';

/**
 * The ONLY pipeline step allowed to send the image to the AI provider.
 * Output is the advanced nested trait payload (16 categories, 221 fields,
 * localized values) plus the compact summary — validated by the strict
 * schema (a missing or extra field fails), language-checked, and
 * safety-scanned across every free-text leaf.
 */
@Injectable()
export class TraitExtractionService {
  public constructor(
    @Inject(AI_PROVIDER_ADAPTER) private readonly aiProvider: AiProviderAdapter,
    private readonly promptTemplate: PromptTemplateRepository,
    private readonly aiSafety: AiSafetyService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async extractTraits(
    image: AiImageInput,
    languageCode: LanguageCodeValue,
    signal?: AbortSignal,
  ): Promise<TraitExtractionResponse> {
    const prompt = this.promptTemplate.buildPrompt(PromptKey.TraitExtraction, {
      [PromptPlaceholder.LanguageCode]: languageCode,
    });

    const rawText = await this.aiProvider.generateFromImageStream(prompt, image, {
      signal,
      validate: buildSchemaValidator(TraitExtractionResponseSchema),
      step: GeminiStep.Extraction,
    });

    const response = parseAiJsonResponse(
      rawText,
      TraitExtractionResponseSchema,
      (issues) => {
        this.logger.warn(`Trait response schema mismatch: ${issues}`);
      },
      (parsed) => {
        if (!isRecord(parsed) || !isRecord(parsed['traits'])) return parsed;
        const traits = parsed['traits'];
        return { ...parsed, traitCount: countPopulatedTraitFields(traits) };
      },
    );
    this.assertRequestedLanguage(response.languageCode, languageCode);
    this.aiSafety.assertTraitTextSafe(collectExtractionTextValues(response));

    this.logger.info(`Extracted ${response.traitCount} visible trait(s)`);
    return response;
  }

  /** The model must localize to the requested language — a drift is invalid. */
  private assertRequestedLanguage(returned: LanguageCodeValue, requested: LanguageCodeValue): void {
    if (returned === requested) {
      return;
    }

    this.logger.warn(`Trait response language mismatch (${returned} != ${requested})`);
    throw buildIntegrationError(ErrorCode.AiResponseInvalid, AI_INVALID_RESPONSE_MESSAGE);
  }
}
