export const PublicFigureSource = {
  Wikidata: 'wikidata',
  Wikipedia: 'wikipedia',
  WikimediaCommons: 'wikimedia-commons',
  Curated: 'curated',
} as const;

export const PUBLIC_FIGURE_SOURCE_VALUES = Object.values(PublicFigureSource);

export type PublicFigureSourceValue = (typeof PublicFigureSource)[keyof typeof PublicFigureSource];
