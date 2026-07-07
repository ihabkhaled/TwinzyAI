/**
 * Candidate global-popularity bands reported by candidate generation.
 * As-const object + derived type — the TypeScript `enum` keyword is banned.
 */
export const PopularityLevel = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
} as const;

export const POPULARITY_LEVEL_VALUES = [
  PopularityLevel.High,
  PopularityLevel.Medium,
  PopularityLevel.Low,
] as const;

export type PopularityLevelValue = (typeof POPULARITY_LEVEL_VALUES)[number];
