import { Injectable } from '@nestjs/common';

import type { LanguageCodeValue, PublicFigureImage } from '@twinzy/shared';

import { WikidataAdapter } from '../adapters/wikidata.adapter';
import { WikimediaCommonsAdapter } from '../adapters/wikimedia-commons.adapter';
import { WikipediaAdapter } from '../adapters/wikipedia.adapter';
import type {
  PublicFigureRemoteEnrichment,
  WikidataPublicFigureMetadata,
  WikipediaPublicFigureMetadata,
} from '../model/public-figure-remote.types';

@Injectable()
export class PublicFigureEnrichmentGatewayService {
  public constructor(
    private readonly wikidata: WikidataAdapter,
    private readonly wikipedia: WikipediaAdapter,
    private readonly commons: WikimediaCommonsAdapter,
  ) {}

  public async enrich(
    entityId: string,
    languageCode: LanguageCodeValue,
    fallbackName: string,
  ): Promise<PublicFigureRemoteEnrichment | undefined> {
    const wikidata = await this.safeWikidata(entityId, languageCode);
    if (wikidata === undefined) {
      return undefined;
    }
    const [wikipedia, image] = await this.loadSources(wikidata, languageCode, fallbackName);
    return this.toRemoteEnrichment(wikidata, wikipedia, image);
  }

  private loadSources(
    wikidata: WikidataPublicFigureMetadata,
    languageCode: LanguageCodeValue,
    fallbackName: string,
  ): Promise<readonly [WikipediaPublicFigureMetadata | undefined, PublicFigureImage | undefined]> {
    return Promise.all([
      this.safeWikipedia(languageCode, wikidata.wikipediaTitle),
      this.safeImage(wikidata.imageFileName, wikidata.localizedName ?? fallbackName),
    ]);
  }

  private toRemoteEnrichment(
    wikidata: WikidataPublicFigureMetadata,
    wikipedia: WikipediaPublicFigureMetadata | undefined,
    image: PublicFigureImage | undefined,
  ): PublicFigureRemoteEnrichment {
    return {
      canonicalName: wikidata.canonicalName,
      localizedName: wikidata.localizedName,
      description: wikidata.description,
      biographySummary: wikipedia?.biographySummary,
      wikipediaUrl: wikipedia?.wikipediaUrl,
      image,
    };
  }

  private async safeWikidata(
    entityId: string,
    languageCode: LanguageCodeValue,
  ): Promise<WikidataPublicFigureMetadata | undefined> {
    try {
      return await this.wikidata.lookup(entityId, languageCode);
    } catch {
      return undefined;
    }
  }

  private async safeWikipedia(
    languageCode: LanguageCodeValue,
    title: string | undefined,
  ): ReturnType<WikipediaAdapter['summary']> {
    if (title === undefined) {
      return undefined;
    }
    try {
      return await this.wikipedia.summary(languageCode, title);
    } catch {
      return undefined;
    }
  }

  private async safeImage(
    fileName: string | undefined,
    alt: string,
  ): ReturnType<WikimediaCommonsAdapter['image']> {
    if (fileName === undefined) {
      return undefined;
    }
    try {
      return await this.commons.image(fileName, alt);
    } catch {
      return undefined;
    }
  }
}
