import { Injectable } from '@nestjs/common';

import type { LanguageCodeValue } from '@twinzy/shared';
import { PublicFigureEntityIdSchema } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { fetchBoundedJson } from '../lib/bounded-json-fetch.util';
import {
  WIKIDATA_ENTITY_DATA_ORIGIN,
  WIKIDATA_ENTITY_DATA_PATH_PREFIX,
} from '../model/public-figure.constants';
import { WikidataEntitySchema } from '../model/public-figure-remote.schemas';
import type {
  WikidataLocalizedValues,
  WikidataPublicFigureMetadata,
} from '../model/public-figure-remote.types';

const localizedValue = (
  values: WikidataLocalizedValues,
  languageCode: string,
): string | undefined => values[languageCode]?.value ?? values['en']?.value;

const toMetadata = (
  data: ReturnType<typeof WikidataEntitySchema.parse>,
  entityId: string,
  languageCode: LanguageCodeValue,
): WikidataPublicFigureMetadata => ({
  canonicalName: data.labels['en']?.value ?? localizedValue(data.labels, languageCode) ?? entityId,
  localizedName: data.labels[languageCode]?.value,
  description: localizedValue(data.descriptions, languageCode),
  wikipediaTitle: data.sitelinks[`${languageCode}wiki`]?.title ?? data.sitelinks['enwiki']?.title,
  imageFileName: data.claims.P18?.[0]?.mainsnak.datavalue?.value,
});

@Injectable()
export class WikidataAdapter {
  public constructor(private readonly config: AppConfigService) {}

  public async lookup(
    entityId: string,
    languageCode: LanguageCodeValue,
  ): Promise<WikidataPublicFigureMetadata | undefined> {
    const validatedEntityId = PublicFigureEntityIdSchema.parse(entityId);
    const url = new URL(
      `${WIKIDATA_ENTITY_DATA_PATH_PREFIX}${validatedEntityId}.json`,
      WIKIDATA_ENTITY_DATA_ORIGIN,
    );
    const raw = await fetchBoundedJson(
      url.href,
      this.config.advancedMatching.requestTimeoutMs,
      this.config.advancedMatching.maxResponseBytes,
    );
    const root = raw as { entities?: Record<string, unknown> };
    const entity = WikidataEntitySchema.safeParse(root.entities?.[validatedEntityId]);
    if (!entity.success) {
      return undefined;
    }
    return toMetadata(entity.data, entityId, languageCode);
  }
}
