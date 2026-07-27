import { Inject, Injectable, Optional } from '@nestjs/common';

import type { CandidateJudgeResponse, ModelCrossCritique } from '@twinzy/shared';
import { CandidateJudgeResponseSchema, PROMPT_JSON_INDENT } from '@twinzy/shared';

import { GeminiStep } from '../../../config/gemini-step.constants';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { buildSchemaValidator, parseAiJsonResponse } from '../lib/json-response.util';
import { mergeCouncilJudgeResponses } from '../lib/judge-council-merge.util';
import { buildMatchingEvidence } from '../lib/matching-evidence.util';
import { assertLocalizedContentLanguage } from '../lib/response-content-language.guard';
import { assertResponseLanguage } from '../lib/response-language.guard';
import {
  collectJudgedLanguageExclusions,
  collectJudgedLocalizedValues,
} from '../lib/response-language-values.util';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';
import { AI_PROVIDER_ADAPTER } from '../model/ai-provider-adapter.types';
import type { JudgeCandidatesInput } from '../model/judge-input.types';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';

import { AdvancedJudgeCouncilService } from './advanced-judge-council.service';
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
    @Optional()
    private readonly advancedCouncil?: AdvancedJudgeCouncilService,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async judgeCandidates(input: JudgeCandidatesInput): Promise<CandidateJudgeResponse> {
    const prompt = this.buildPrompt(input);
    const responses = await this.generateResponses(prompt, input.signal);
    this.validateResponseLanguages(responses, input);
    const critiques = await this.runCrossCritique(input, responses);
    const merged = mergeCouncilJudgeResponses(responses);
    const scored = this.advancedCouncil?.score(input, responses, merged) ?? merged;
    const response = this.withCritique(scored, critiques);
    const finalized = await this.runFinalizer(input, response);
    const safeResults = this.validateResults(finalized, input);
    return { ...finalized, results: safeResults };
  }

  private validateResults(
    response: CandidateJudgeResponse,
    input: JudgeCandidatesInput,
  ): CandidateJudgeResponse['results'] {
    const results = this.filterToCandidatePool(
      this.aiSafety.filterJudgedResults(response.results),
      input,
    );
    assertLocalizedContentLanguage(
      collectJudgedLocalizedValues(results),
      input.languageCode,
      collectJudgedLanguageExclusions(results),
    );
    this.logger.info(`Judge kept ${results.length} safe result(s)`);
    return results;
  }

  private withCritique(
    response: CandidateJudgeResponse,
    critiques: readonly ModelCrossCritique[],
  ): CandidateJudgeResponse {
    const suggestedSearchTags = [
      ...new Set(critiques.flatMap((critique) => critique.suggestedSearchTags)),
    ];
    return {
      ...response,
      ...(critiques.some((critique) => critique.requiresSecondRetrievalPass) && {
        requiresSecondRetrievalPass: true,
        suggestedSearchTags,
      }),
    };
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

  private validateResponseLanguages(
    responses: readonly CandidateJudgeResponse[],
    input: JudgeCandidatesInput,
  ): void {
    for (const response of responses) {
      assertResponseLanguage(response.languageCode, input.languageCode);
    }
  }

  private parseResponse(rawText: string): CandidateJudgeResponse {
    return parseAiJsonResponse(rawText, CandidateJudgeResponseSchema, (issues) => {
      this.logger.warn(`Judge response schema mismatch: ${issues}`);
    });
  }

  private filterToCandidatePool(
    results: CandidateJudgeResponse['results'],
    input: JudgeCandidatesInput,
  ): CandidateJudgeResponse['results'] {
    const entityIds = new Set(
      input.candidates.flatMap((candidate) =>
        candidate.entityId === undefined ? [] : [candidate.entityId],
      ),
    );
    if (entityIds.size === 0) {
      return results;
    }
    return results.filter(
      (result) => result.entityId !== undefined && entityIds.has(result.entityId),
    );
  }

  private async generateResponses(
    prompt: string,
    signal?: AbortSignal,
  ): Promise<readonly CandidateJudgeResponse[]> {
    const councilResults = this.advancedCouncil?.run(prompt);
    if (councilResults !== undefined) {
      const results = await councilResults;
      return results.map((result) => this.parseResponse(result.text));
    }
    const rawText = await this.aiProvider.generateFromTextStream(prompt, {
      signal,
      validate: buildSchemaValidator(CandidateJudgeResponseSchema),
      step: GeminiStep.Judge,
    });
    return [this.parseResponse(rawText)];
  }

  private async runCrossCritique(
    input: JudgeCandidatesInput,
    judgeResponses: readonly CandidateJudgeResponse[],
  ): Promise<readonly ModelCrossCritique[]> {
    return (await this.advancedCouncil?.critique(input, judgeResponses)) ?? [];
  }

  private async runFinalizer(
    input: JudgeCandidatesInput,
    response: CandidateJudgeResponse,
  ): Promise<CandidateJudgeResponse> {
    return (await this.advancedCouncil?.finalize(input, response)) ?? response;
  }
}
