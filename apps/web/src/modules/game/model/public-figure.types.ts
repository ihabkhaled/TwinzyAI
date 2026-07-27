export interface PublicFigureImageView {
  thumbnailUrl: string;
  fullUrl: string;
  alt: string;
  author?: string;
  credit?: string;
  licenseName?: string;
  licenseUrl?: string;
  sourcePageUrl: string;
}

export interface PublicFigureView {
  entityId: string;
  canonicalName: string;
  localizedName?: string;
  description?: string;
  biographySummary?: string;
  occupations: string[];
  countryOrRegion?: string;
  wikipediaUrl?: string;
  googleSearchUrl: string;
  image?: PublicFigureImageView;
}
