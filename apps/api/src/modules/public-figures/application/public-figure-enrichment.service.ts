import { Injectable } from '@nestjs/common';

import type {
  LanguageCodeValue,
  PublicFigureEnrichment,
  PublicFigureProfile,
} from '@twinzy/shared';
import { PublicFigureEnrichmentSchema } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { PublicFigureCatalogRepository } from '../infrastructure/public-figure-catalog.repository';
import { PublicFigureMetadataCacheRepository } from '../infrastructure/public-figure-metadata-cache.repository';
import { buildGoogleSearchUrl } from '../lib/public-figure-url.util';
import type { PublicFigureRemoteEnrichment } from '../model/public-figure-remote.types';

import { PublicFigureEnrichmentGatewayService } from './public-figure-enrichment-gateway.service';

@Injectable()
export class PublicFigureEnrichmentService {
  public constructor(
    private readonly catalog: PublicFigureCatalogRepository,
    private readonly cache: PublicFigureMetadataCacheRepository,
    private readonly config: AppConfigService,
    private readonly gateway: PublicFigureEnrichmentGatewayService,
  ) {}

  public async enrich(
    entityId: string,
    languageCode: LanguageCodeValue,
  ): Promise<PublicFigureEnrichment | undefined> {
    if (!this.config.advancedMatching.enrichmentEnabled) {
      return undefined;
    }
    const cached = await this.cache.get(entityId, languageCode);
    if (cached !== undefined) {
      return cached;
    }
    const profile = this.catalog.findByEntityId(entityId);
    if (profile === undefined) {
      return undefined;
    }
    const remote = await this.gateway.enrich(entityId, languageCode, profile.canonicalName);
    const enrichment = this.buildEnrichment(profile, entityId, languageCode, remote);
    await this.cacheEnrichment(enrichment, languageCode);
    return enrichment;
  }

  private buildEnrichment(
    profile: PublicFigureProfile,
    entityId: string,
    languageCode: LanguageCodeValue,
    remote: PublicFigureRemoteEnrichment | undefined,
  ): PublicFigureEnrichment {
    return PublicFigureEnrichmentSchema.parse({
      entityId,
      canonicalName: remote?.canonicalName ?? profile.canonicalName,
      localizedName: remote?.localizedName ?? profile.localizedNames[languageCode],
      description: remote?.description,
      biographySummary: remote?.biographySummary,
      occupations: profile.publicCategories,
      countryOrRegion: profile.countryOrRegion,
      wikipediaUrl: remote?.wikipediaUrl,
      googleSearchUrl: buildGoogleSearchUrl(profile.canonicalName),
      image: remote?.image,
    });
  }

  private async cacheEnrichment(
    enrichment: PublicFigureEnrichment,
    languageCode: LanguageCodeValue,
  ): Promise<void> {
    await this.cache.set(
      enrichment.entityId,
      languageCode,
      enrichment,
      this.config.advancedMatching.cacheTtlSeconds,
    );
  }
}
