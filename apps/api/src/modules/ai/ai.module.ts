import { Module } from '@nestjs/common';

import { PrivacyModule } from '../privacy';
import { PublicFiguresModule } from '../public-figures';

import { AiRouterService } from './adapters/ai-router.service';
import { AiShadowService } from './adapters/ai-shadow.service';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { ProviderRegistryService } from './adapters/provider-registry.service';
import { AdvancedCandidateCouncilService } from './application/advanced-candidate-council.service';
import { AdvancedJudgeCouncilService } from './application/advanced-judge-council.service';
import { AiSafetyService } from './application/ai-safety.service';
import { AiStepConcurrencyGate } from './application/ai-step-concurrency.gate';
import { CandidateGenerationService } from './application/candidate-generation.service';
import { CandidateJudgeService } from './application/candidate-judge.service';
import { CandidateRecallService } from './application/candidate-recall.service';
import { ConsensusFinalizerService } from './application/consensus-finalizer.service';
import { ConsensusScoringService } from './application/consensus-scoring.service';
import { CrossCritiqueService } from './application/cross-critique.service';
import { MultiModelCouncilService } from './application/multi-model-council.service';
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
  imports: [PrivacyModule, PublicFiguresModule],
  providers: [
    GeminiAdapter,
    ProviderRegistryService,
    AiShadowService,
    { provide: AI_PROVIDER_ADAPTER, useClass: AiRouterService },
    PromptTemplateRepository,
    AiSafetyService,
    AdvancedCandidateCouncilService,
    AdvancedJudgeCouncilService,
    AiStepConcurrencyGate,
    TraitExtractionService,
    CandidateGenerationService,
    CandidateRecallService,
    CandidateJudgeService,
    ConsensusScoringService,
    ConsensusFinalizerService,
    CrossCritiqueService,
    MultiModelCouncilService,
    ResultTranslationService,
  ],
  exports: [
    TraitExtractionService,
    CandidateGenerationService,
    CandidateRecallService,
    CandidateJudgeService,
    ConsensusScoringService,
    CrossCritiqueService,
    MultiModelCouncilService,
    ResultTranslationService,
  ],
})
export class AiModule {}
