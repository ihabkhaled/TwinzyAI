import { Injectable, NotFoundException } from '@nestjs/common';

import type { LanguageCodeValue, PublicFigureEnrichment } from '@twinzy/shared';

import { PublicFigureEnrichmentService } from './public-figure-enrichment.service';

@Injectable()
export class GetPublicFigureDetailsUseCase {
  public constructor(private readonly enrichment: PublicFigureEnrichmentService) {}

  public async execute(
    entityId: string,
    languageCode: LanguageCodeValue,
  ): Promise<PublicFigureEnrichment> {
    const result = await this.enrichment.enrich(entityId, languageCode);
    if (result === undefined) {
      throw new NotFoundException('Public figure was not found');
    }
    return result;
  }
}
