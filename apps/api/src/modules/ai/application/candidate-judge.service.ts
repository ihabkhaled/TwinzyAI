import { Inject, Injectable } from '@nestjs/common';

import type { CandidateJudgeResponse } from '@twinzy/shared';
import { CandidateJudgeResponseSchema, PROMPT_JSON_INDENT } from '@twinzy/shared';

import { GeminiStep } from '../../../config/gemini-step.constants';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { buildSchemaValidator, parseAiJsonResponse } from '../lib/json-response.util';
import { buildMatchingEvidence } from '../lib/matching-evidence.util';
import { assertResponseLanguage } from '../lib/response-language.guard';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';
import { AI_PROVIDER_ADAPTER } from '../model/ai-provider-adapter.types';
import type { JudgeCandidatesInput } from '../model/judge-input.types';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';

import { AiSafetyService } from './ai-safety.service';

const LOG_CONTEXT = 'CandidateJudge';

/**
 * TEXT-ONLY strict-judge step: receives written matching evidence and the
 * candidate pool, re-scores conservatively, filters weak/unsafe entries, and
 * returns the final localized safe set. The provider method has no image slot,
 * so the photo cannot cross this boundary.
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

  public async judgeCandidates(input: JudgeCandidatesInput): Promise<CandidateJudgeResponse> {
    const prompt = this.buildPrompt(input);
    const rawText = await this.aiProvider.generateFromTextStream(prompt, {
      signal: input.signal,
      validate: buildSchemaValidator(CandidateJudgeResponseSchema),
      step: GeminiStep.Judge,
    });
    const response = this.parseResponse(rawText);
    assertResponseLanguage(response.languageCode, input.languageCode);
    const safeResults = this.aiSafety.filterJudgedResults(response.results);
    this.logger.info(`Judge kept ${safeResults.length} safe result(s)`);
    return { ...response, results: safeResults };
  }

  private buildPrompt(input: JudgeCandidatesInput): string {
    return this.promptTemplate.buildPrompt(PromptKey.CandidateJudge, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify(
        buildMatchingEvidence(input.extraction),
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.CandidatesJson]: JSON.stringify(
        { candidates: input.candidates },
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.LanguageCode]: input.languageCode,
      [PromptPlaceholder.ResultCount]: String(input.resultCount),
    });
  }

  private parseResponse(rawText: string): CandidateJudgeResponse {
    return parseAiJsonResponse(rawText, CandidateJudgeResponseSchema, (issues) => {
      this.logger.warn(`Judge response schema mismatch: ${issues}`);
    });
  }
}
