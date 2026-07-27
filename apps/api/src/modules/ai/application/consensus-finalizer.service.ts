import { Injectable } from '@nestjs/common';

import type { CandidateJudgeResponse } from '@twinzy/shared';
import { ConsensusFinalizerResponseSchema, PROMPT_JSON_INDENT } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { applyConsensusExplanations } from '../lib/consensus-finalizer.mapper';
import { parseAiJsonResponse } from '../lib/json-response.util';
import type { JudgeCandidatesInput } from '../model/judge-input.types';
import { PromptKey, PromptPlaceholder } from '../model/prompt-version.constants';

import { MultiModelCouncilService } from './multi-model-council.service';

@Injectable()
export class ConsensusFinalizerService {
  public constructor(
    private readonly config: AppConfigService,
    private readonly council: MultiModelCouncilService,
    private readonly promptTemplate: PromptTemplateRepository,
  ) {}

  public async finalize(
    input: JudgeCandidatesInput,
    authoritative: CandidateJudgeResponse,
  ): Promise<CandidateJudgeResponse> {
    const participant = this.config.advancedMatching.finalizer;
    if (participant === undefined) {
      return authoritative;
    }
    try {
      return await this.requestFinalization(input, authoritative, participant);
    } catch {
      return authoritative;
    }
  }

  private async requestFinalization(
    input: JudgeCandidatesInput,
    authoritative: CandidateJudgeResponse,
    participant: NonNullable<AppConfigService['advancedMatching']['finalizer']>,
  ): Promise<CandidateJudgeResponse> {
    const text = await this.requestText(input, authoritative, participant);
    if (text === undefined) {
      return authoritative;
    }
    const finalizer = parseAiJsonResponse(text, ConsensusFinalizerResponseSchema);
    return finalizer.languageCode === input.languageCode
      ? applyConsensusExplanations(authoritative, finalizer.explanations)
      : authoritative;
  }

  private async requestText(
    input: JudgeCandidatesInput,
    authoritative: CandidateJudgeResponse,
    participant: NonNullable<AppConfigService['advancedMatching']['finalizer']>,
  ): Promise<string | undefined> {
    const results = await this.council.runTextCouncil({
      prompt: this.buildPrompt(input, authoritative),
      participants: [participant],
      minimumSuccessfulParticipants: 1,
      timeoutMs: this.config.advancedMatching.stepTimeoutMs,
    });
    return results[0]?.text;
  }

  private buildPrompt(input: JudgeCandidatesInput, authoritative: CandidateJudgeResponse): string {
    return this.promptTemplate.buildPrompt(PromptKey.ConsensusFinalizer, {
      [PromptPlaceholder.ConsensusJson]: JSON.stringify(authoritative, null, PROMPT_JSON_INDENT),
      [PromptPlaceholder.CandidatesJson]: JSON.stringify(
        input.candidates,
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.LanguageCode]: input.languageCode,
    });
  }
}
