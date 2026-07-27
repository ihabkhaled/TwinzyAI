import { Injectable } from '@nestjs/common';

import type { LanguageCodeValue } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { fetchBoundedJson } from '../lib/bounded-json-fetch.util';
import {
  PUBLIC_FIGURE_BIOGRAPHY_SENTENCE_LIMIT,
  WIKIPEDIA_SUMMARY_PATH_PREFIX,
} from '../model/public-figure.constants';
import { WikipediaSummarySchema } from '../model/public-figure-remote.schemas';
import type { WikipediaPublicFigureMetadata } from '../model/public-figure-remote.types';

const summarize = (value: string): string =>
  value
    .split(/(?<=[.!?])\s+/u)
    .slice(0, PUBLIC_FIGURE_BIOGRAPHY_SENTENCE_LIMIT)
    .join(' ');

@Injectable()
export class WikipediaAdapter {
  public constructor(private readonly config: AppConfigService) {}

  public async summary(
    languageCode: LanguageCodeValue,
    title: string,
  ): Promise<WikipediaPublicFigureMetadata | undefined> {
    const url = new URL(
      `${WIKIPEDIA_SUMMARY_PATH_PREFIX}${encodeURIComponent(title)}`,
      `https://${languageCode}.wikipedia.org`,
    );
    const raw = await fetchBoundedJson(
      url.href,
      this.config.advancedMatching.requestTimeoutMs,
      this.config.advancedMatching.maxResponseBytes,
    );
    const parsed = WikipediaSummarySchema.safeParse(raw);
    if (!parsed.success) {
      return undefined;
    }
    return {
      biographySummary: summarize(parsed.data.extract),
      wikipediaUrl: parsed.data.content_urls.desktop.page,
    };
  }
}
