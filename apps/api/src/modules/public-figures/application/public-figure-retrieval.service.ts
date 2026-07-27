import { Injectable } from '@nestjs/common';

import type { QualitativeMatchingProfile } from '@twinzy/shared';

import { PublicFigureCatalogRepository } from '../infrastructure/public-figure-catalog.repository';
import { scorePublicFigureProfile, toRetrievalEvidence } from '../lib/public-figure-search.util';
import { PUBLIC_FIGURE_RETRIEVAL_LIMIT } from '../model/public-figure.constants';
import type { PublicFigureRetrievalResult } from '../model/public-figure.types';

@Injectable()
export class PublicFigureRetrievalService {
  public constructor(private readonly catalog: PublicFigureCatalogRepository) {}

  public retrieve(
    profile: QualitativeMatchingProfile,
    languageCode: string,
    limit: number,
  ): readonly PublicFigureRetrievalResult[] {
    const evidence = toRetrievalEvidence(profile);
    return this.catalog
      .list()
      .map((candidate) => scorePublicFigureProfile(candidate, evidence, languageCode))
      .toSorted(
        (left, right) =>
          right.retrievalScore - left.retrievalScore || left.entityId.localeCompare(right.entityId),
      )
      .slice(0, Math.min(limit, PUBLIC_FIGURE_RETRIEVAL_LIMIT));
  }
}
