import type { PublicFigureImage } from '@twinzy/shared';

export interface WikidataPublicFigureMetadata {
  readonly canonicalName: string;
  readonly localizedName: string | undefined;
  readonly description: string | undefined;
  readonly wikipediaTitle: string | undefined;
  readonly imageFileName: string | undefined;
}

export interface WikipediaPublicFigureMetadata {
  readonly biographySummary: string;
  readonly wikipediaUrl: string;
}

export interface PublicFigureRemoteEnrichment {
  readonly canonicalName: string | undefined;
  readonly localizedName: string | undefined;
  readonly description: string | undefined;
  readonly biographySummary: string | undefined;
  readonly wikipediaUrl: string | undefined;
  readonly image: PublicFigureImage | undefined;
}

export type WikidataLocalizedValues = Readonly<Record<string, { readonly value: string }>>;
