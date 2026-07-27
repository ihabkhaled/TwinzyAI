import { Injectable } from '@nestjs/common';

import type { ModelCrossCritique } from '@twinzy/shared';
import { ModelCrossCritiqueSchema, PROMPT_JSON_INDENT } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { parseAiJsonResponse } from '../lib/json-response.util';
import { buildMatchingEvidence } from '../lib/matching-evidence.util';
import type { CrossCritiqueInput } from '../model/cross-critique.types';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';

import { MultiModelCouncilService } from './multi-model-council.service';

@Injectable()
export class CrossCritiqueService {
  public constructor(
    private readonly promptTemplate: PromptTemplateRepository,
    private readonly council: MultiModelCouncilService,
    private readonly config: AppConfigService,
  ) {}

  public async critique(input: CrossCritiqueInput): Promise<readonly ModelCrossCritique[]> {
    const advanced = this.config.advancedMatching;
    if (!advanced.crossCritiqueEnabled || advanced.critiqueParticipants.length === 0) {
      return [];
    }
    const results = await this.council.runTextCouncil({
      prompt: this.buildPrompt(input),
      participants: advanced.critiqueParticipants,
      minimumSuccessfulParticipants: advanced.minSuccessfulParticipants,
      timeoutMs: advanced.stepTimeoutMs,
    });
    return results.map((result) => parseAiJsonResponse(result.text, ModelCrossCritiqueSchema));
  }

  private buildPrompt(input: CrossCritiqueInput): string {
    return this.promptTemplate.buildPrompt(PromptKey.CrossCritique, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify(
        buildMatchingEvidence(input.extraction),
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.CandidatesJson]: JSON.stringify(
        input.candidates,
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.CouncilJson]: JSON.stringify(
        input.judgeResponses,
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.LanguageCode]: input.languageCode,
    });
  }
}
