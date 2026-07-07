import { Module } from '@nestjs/common';

import { PrivacyModule } from '../privacy';

import { GeminiAdapter } from './adapters/gemini.adapter';
import { AiSafetyService } from './application/ai-safety.service';
import { CandidateGenerationService } from './application/candidate-generation.service';
import { CandidateJudgeService } from './application/candidate-judge.service';
import { ResultTranslationService } from './application/result-translation.service';
import { TraitExtractionService } from './application/trait-extraction.service';
import { PromptTemplateRepository } from './infrastructure/prompt-template.repository';
import { AI_PROVIDER_ADAPTER } from './model/ai-provider-adapter.types';

/**
 * AI module. The provider is bound behind the AI_PROVIDER_ADAPTER port —
 * swapping Gemini for another provider means one new adapter and one line
 * here (see skills/add-ai-provider.md).
 */
@Module({
  imports: [PrivacyModule],
  providers: [
    { provide: AI_PROVIDER_ADAPTER, useClass: GeminiAdapter },
    PromptTemplateRepository,
    AiSafetyService,
    TraitExtractionService,
    CandidateGenerationService,
    CandidateJudgeService,
    ResultTranslationService,
  ],
  exports: [
    TraitExtractionService,
    CandidateGenerationService,
    CandidateJudgeService,
    ResultTranslationService,
  ],
})
export class AiModule {}
