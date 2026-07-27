import { Injectable } from '@nestjs/common';

import type { Candidate, LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { PublicFigureRetrievalService } from '../../public-figures';
import { attachCatalogEvidence } from '../lib/catalog-candidate.mapper';
import type { MultiModelCouncilResult } from '../model/multi-model-council.types';

import { MultiModelCouncilService } from './multi-model-council.service';

@Injectable()
export class AdvancedCandidateCouncilService {
  public constructor(
    private readonly config: AppConfigService,
    private readonly retrieval: PublicFigureRetrievalService,
    private readonly council: MultiModelCouncilService,
  ) {}

  public catalog(
    extraction: TraitExtractionResponse,
    languageCode: LanguageCodeValue,
  ): ReturnType<PublicFigureRetrievalService['retrieve']> | undefined {
    const advanced = this.config.advancedMatching;
    if (!advanced.catalogEnabled || extraction.matchingProfile === undefined) {
      return undefined;
    }
    return this.retrieval.retrieve(
      extraction.matchingProfile,
      languageCode,
      advanced.maxCombinedCandidates,
    );
  }

  public filterToCatalog(
    candidates: readonly Candidate[],
    extraction: TraitExtractionResponse,
    languageCode: LanguageCodeValue,
  ): Candidate[] {
    const catalog = this.catalog(extraction, languageCode);
    if (catalog === undefined) {
      return [...candidates];
    }
    return attachCatalogEvidence(candidates, catalog);
  }

  public run(prompt: string): Promise<readonly MultiModelCouncilResult[]> | undefined {
    const advanced = this.config.advancedMatching;
    if (!advanced.ensembleEnabled || advanced.generationParticipants.length === 0) {
      return undefined;
    }
    return this.council.runTextCouncil({
      prompt,
      participants: advanced.generationParticipants,
      minimumSuccessfulParticipants: advanced.minSuccessfulParticipants,
      timeoutMs: advanced.stepTimeoutMs,
    });
  }

  public get combinedCandidateLimit(): number {
    return this.config.advancedMatching.maxCombinedCandidates;
  }
}
