export const PublicFigureRetrievalLane = {
  StructureFirst: 'structure-first',
  AccessoryAgnostic: 'accessory-agnostic',
  HairAndFacialHair: 'hair-and-facial-hair',
  ExpressionAndPresentation: 'expression-and-presentation',
  RegionalFirst: 'regional-first',
  BroadGlobal: 'broad-global',
  Wildcard: 'wildcard',
} as const;

export type PublicFigureRetrievalLaneValue =
  (typeof PublicFigureRetrievalLane)[keyof typeof PublicFigureRetrievalLane];

export const PUBLIC_FIGURE_RETRIEVAL_LIMIT = 25;

export const PUBLIC_FIGURE_REGION_BY_LANGUAGE: Readonly<Record<string, readonly string[]>> = {
  ar: ['egypt', 'mena', 'middle east', 'north africa'],
};

export const PUBLIC_FIGURE_ALLOWED_HOST_SUFFIXES = [
  'wikidata.org',
  'wikipedia.org',
  'wikimedia.org',
  'creativecommons.org',
] as const;

export const PUBLIC_FIGURE_GOOGLE_SEARCH_ORIGIN = 'https://www.google.com';
export const PUBLIC_FIGURE_GOOGLE_SEARCH_PATH = '/search';
export const MILLISECONDS_PER_SECOND = 1000;
export const PUBLIC_FIGURE_STABLE_MATCH_WEIGHT = 5;
export const PUBLIC_FIGURE_MUTABLE_MATCH_WEIGHT = 2;
export const PUBLIC_FIGURE_CONTRADICTION_WEIGHT = 5;
export const PUBLIC_FIGURE_MAX_SOURCE_CONFIDENCE = 100;
export const WIKIDATA_ENTITY_DATA_ORIGIN = 'https://www.wikidata.org';
export const WIKIDATA_ENTITY_DATA_PATH_PREFIX = '/wiki/Special:EntityData/';
export const WIKIPEDIA_SUMMARY_PATH_PREFIX = '/api/rest_v1/page/summary/';
export const COMMONS_API_ORIGIN = 'https://commons.wikimedia.org';
export const COMMONS_API_PATH = '/w/api.php';
export const PUBLIC_FIGURE_BIOGRAPHY_SENTENCE_LIMIT = 3;
