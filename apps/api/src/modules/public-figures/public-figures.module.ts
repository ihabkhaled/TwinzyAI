import { Module } from '@nestjs/common';

import { AppConfigService } from '../../config/app-config.service';

import { WikidataAdapter } from './adapters/wikidata.adapter';
import { WikimediaCommonsAdapter } from './adapters/wikimedia-commons.adapter';
import { WikipediaAdapter } from './adapters/wikipedia.adapter';
import { PublicFigureController } from './api/public-figure.controller';
import { GetPublicFigureDetailsUseCase } from './application/get-public-figure-details.use-case';
import { PublicFigureEnrichmentService } from './application/public-figure-enrichment.service';
import { PublicFigureEnrichmentGatewayService } from './application/public-figure-enrichment-gateway.service';
import { PublicFigureEntityResolutionService } from './application/public-figure-entity-resolution.service';
import { PublicFigureRetrievalService } from './application/public-figure-retrieval.service';
import { PublicFigureCatalogRepository } from './infrastructure/public-figure-catalog.repository';
import { PublicFigureMetadataCacheRepository } from './infrastructure/public-figure-metadata-cache.repository';

@Module({
  controllers: [PublicFigureController],
  providers: [
    PublicFigureCatalogRepository,
    WikidataAdapter,
    WikipediaAdapter,
    WikimediaCommonsAdapter,
    PublicFigureEnrichmentGatewayService,
    PublicFigureRetrievalService,
    PublicFigureEntityResolutionService,
    PublicFigureEnrichmentService,
    GetPublicFigureDetailsUseCase,
    {
      provide: PublicFigureMetadataCacheRepository,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): PublicFigureMetadataCacheRepository =>
        new PublicFigureMetadataCacheRepository(config.advancedMatching.cacheMaxItems),
    },
  ],
  exports: [
    PublicFigureRetrievalService,
    PublicFigureEntityResolutionService,
    PublicFigureEnrichmentService,
  ],
})
export class PublicFiguresModule {}
