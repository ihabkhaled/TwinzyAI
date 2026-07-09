import { Inject, Injectable } from '@nestjs/common';

import type { FinalGameResult, FinalResultItem, LanguageCodeValue } from '@twinzy/shared';
import {
  FinalGameResultSchema,
  NO_MATCH_FALLBACK_BY_LANGUAGE,
  PROMPT_JSON_INDENT,
  RESULT_DISCLAIMER_BY_LANGUAGE,
} from '@twinzy/shared';

import { ERROR_MESSAGE_KEY_BY_CODE, ErrorCode, IntegrationError } from '../../../core/errors';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { buildSchemaValidator, parseAiJsonResponse } from '../lib/json-response.util';
import { collectTraitTextValues } from '../lib/trait-text.util';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';
import { AI_PROVIDER_ADAPTER } from '../model/ai-provider-adapter.types';
import { AI_INVALID_RESPONSE_MESSAGE } from '../model/gemini.constants';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';

import { AiSafetyService } from './ai-safety.service';

const LOG_CONTEXT = 'ResultTranslation';

/**
 * TEXT-ONLY translation step for language switching. The model only ever
 * receives the existing structured result JSON (never the image) and may only
 * influence localized TEXT: every canonical field — names, ranks, scores,
 * verdicts, confidence, categories, counts — is overwritten from the original
 * server-side afterwards, so a misbehaving model cannot re-match, re-rank, or
 * re-score. The disclaimer and fallback are replaced with the server's own
 * localized constants, and all translated text is safety-filtered; an unsafe
 * or structurally-drifted translation rejects the whole response (the client
 * keeps showing the previous result).
 */
@Injectable()
export class ResultTranslationService {
  public constructor(
    @Inject(AI_PROVIDER_ADAPTER) private readonly aiProvider: AiProviderAdapter,
    private readonly promptTemplate: PromptTemplateRepository,
    private readonly aiSafety: AiSafetyService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async translateResult(
    original: FinalGameResult,
    targetLanguageCode: LanguageCodeValue,
  ): Promise<FinalGameResult> {
    const prompt = this.promptTemplate.buildPrompt(PromptKey.TranslateResult, {
      [PromptPlaceholder.ResultJson]: JSON.stringify(original, null, PROMPT_JSON_INDENT),
      [PromptPlaceholder.TargetLanguageCode]: targetLanguageCode,
    });

    const rawText = await this.aiProvider.generateFromTextStream(
      prompt,
      undefined,
      undefined,
      buildSchemaValidator(FinalGameResultSchema),
    );
    const translated = parseAiJsonResponse(rawText, FinalGameResultSchema, (issues) => {
      this.logger.warn(`Translated result schema mismatch: ${issues}`);
    });

    const preserved = this.preserveCanonicalFields(original, translated, targetLanguageCode);
    this.assertTranslatedTextSafe(preserved);

    this.logger.info(`Translated result to ${targetLanguageCode}`);
    return preserved;
  }

  /**
   * Re-impose every canonical (non-text) field from the original result. The
   * model's output only survives in localized text positions; a shape drift
   * (added/removed/reordered results or summary entries) is rejected.
   */
  private preserveCanonicalFields(
    original: FinalGameResult,
    translated: FinalGameResult,
    targetLanguageCode: LanguageCodeValue,
  ): FinalGameResult {
    if (
      translated.results.length !== original.results.length ||
      translated.compactTraitSummary.length !== original.compactTraitSummary.length
    ) {
      throw this.invalidTranslation('Translated result changed the response shape');
    }

    const results = original.results.map((originalItem, index) => {
      const translatedItem = translated.results[index];
      if (translatedItem?.name !== originalItem.name) {
        throw this.invalidTranslation('Translated result changed or reordered names');
      }
      return this.preserveResultItem(originalItem, translatedItem);
    });

    return {
      ...translated,
      promptVersion: original.promptVersion,
      languageCode: targetLanguageCode,
      resultCount: original.resultCount,
      traitCount: original.traitCount,
      results,
      disclaimer: RESULT_DISCLAIMER_BY_LANGUAGE[targetLanguageCode],
      fallbackMessage:
        original.fallbackMessage === '' ? '' : NO_MATCH_FALLBACK_BY_LANGUAGE[targetLanguageCode],
    };
  }

  /** Localized text comes from the translation; everything else is canonical. */
  private preserveResultItem(
    original: FinalResultItem,
    translated: FinalResultItem,
  ): FinalResultItem {
    return {
      ...translated,
      name: original.name,
      rank: original.rank,
      finalStyleVibeFitScore: original.finalStyleVibeFitScore,
      confidenceLevel: original.confidenceLevel,
      verdict: original.verdict,
      publicCategory: original.publicCategory,
      safetyCheck: original.safetyCheck,
    };
  }

  /** Any forbidden wording anywhere in the translated text rejects it all. */
  private assertTranslatedTextSafe(result: FinalGameResult): void {
    this.aiSafety.assertTraitTextSafe([
      ...collectTraitTextValues(result.traits),
      ...result.compactTraitSummary,
      ...result.results.flatMap((item) => [
        item.countryOrRegion,
        item.finalReason,
        item.judgeNotes,
        ...item.topMatchingTraits,
        ...item.secondaryMatchingTraits,
        ...item.weakOrUncertainTraits,
        ...item.mismatchWarnings,
      ]),
    ]);
  }

  private invalidTranslation(reason: string): IntegrationError {
    this.logger.warn(reason);
    return new IntegrationError(
      AI_INVALID_RESPONSE_MESSAGE,
      ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.AiResponseInvalid],
      ErrorCode.AiResponseInvalid,
    );
  }
}
