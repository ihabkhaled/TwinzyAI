export const PublicCategory = {
  Actor: 'actor',
  Singer: 'singer',
  Creator: 'creator',
  Athlete: 'athlete',
  PublicFigure: 'public_figure',
  Other: 'other',
} as const;

export const PUBLIC_CATEGORY_VALUES = [
  PublicCategory.Actor,
  PublicCategory.Singer,
  PublicCategory.Creator,
  PublicCategory.Athlete,
  PublicCategory.PublicFigure,
  PublicCategory.Other,
] as const;

export type PublicCategoryValue = (typeof PUBLIC_CATEGORY_VALUES)[number];
