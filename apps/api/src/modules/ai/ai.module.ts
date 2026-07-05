import { Module } from '@nestjs/common';

import { PrivacyModule } from '../privacy/privacy.module';

import { GeminiAdapter } from './adapters/gemini.adapter';
import { AI_PROVIDER_ADAPTER } from './interfaces/ai-provider-adapter.interface';
import { PromptLoaderService } from './prompts/prompt-loader.service';
import { AiSafetyService } from './services/ai-safety.service';
import { CandidateGenerationService } from './services/candidate-generation.service';
import { CandidateJudgeService } from './services/candidate-judge.service';
import { TraitExtractionService } from './services/trait-extraction.service';

/**
 * AI module. The provider is bound behind the AI_PROVIDER_ADAPTER port —
 * swapping Gemini for another provider means one new adapter and one line
 * here (see skills/add-ai-provider.md).
 */
@Module({
  imports: [PrivacyModule],
  providers: [
    { provide: AI_PROVIDER_ADAPTER, useClass: GeminiAdapter },
    PromptLoaderService,
    AiSafetyService,
    TraitExtractionService,
    CandidateGenerationService,
    CandidateJudgeService,
  ],
  exports: [TraitExtractionService, CandidateGenerationService, CandidateJudgeService],
})
export class AiModule {}
