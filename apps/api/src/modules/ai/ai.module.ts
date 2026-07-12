import { Module } from '@nestjs/common';

import { PrivacyModule } from '../privacy';

import { AiRouterService } from './adapters/ai-router.service';
import { AiShadowService } from './adapters/ai-shadow.service';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { ProviderRegistryService } from './adapters/provider-registry.service';
import { AiSafetyService } from './application/ai-safety.service';
import { AiStepConcurrencyGate } from './application/ai-step-concurrency.gate';
import { CandidateGenerationService } from './application/candidate-generation.service';
import { CandidateJudgeService } from './application/candidate-judge.service';
import { CandidateRecallService } from './application/candidate-recall.service';
import { ResultTranslationService } from './application/result-translation.service';
import { TraitExtractionService } from './application/trait-extraction.service';
import { PromptTemplateRepository } from './infrastructure/prompt-template.repository';
import { AI_PROVIDER_ADAPTER } from './model/ai-provider-adapter.types';

/**
 * AI module. Step services consume the AI_PROVIDER_ADAPTER port, served by
 * the provider-agnostic AiRouterService: it resolves each step's
 * env-configured provider:model route chain and dispatches to the matching
 * adapter from the ProviderRegistry (Gemini always; each OpenAI-compatible
 * provider only when its API key is configured). A Gemini-only configuration
 * routes exactly as before — the router walks gemini entries.
 */
@Module({
  imports: [PrivacyModule],
  providers: [
    GeminiAdapter,
    ProviderRegistryService,
    AiShadowService,
    { provide: AI_PROVIDER_ADAPTER, useClass: AiRouterService },
    PromptTemplateRepository,
    AiSafetyService,
    AiStepConcurrencyGate,
    TraitExtractionService,
    CandidateGenerationService,
    CandidateRecallService,
    CandidateJudgeService,
    ResultTranslationService,
  ],
  exports: [
    TraitExtractionService,
    CandidateGenerationService,
    CandidateRecallService,
    CandidateJudgeService,
    ResultTranslationService,
  ],
})
export class AiModule {}
