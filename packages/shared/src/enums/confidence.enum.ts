/**
 * Model-reported confidence bands used across trait extraction, candidate
 * generation, and the judge. As-const object + derived type — the TypeScript
 * `enum` keyword is banned repo-wide.
 */
export const ConfidenceLevel = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
} as const;

export const CONFIDENCE_LEVEL_VALUES = [
  ConfidenceLevel.High,
  ConfidenceLevel.Medium,
  ConfidenceLevel.Low,
] as const;

export type ConfidenceLevelValue = (typeof CONFIDENCE_LEVEL_VALUES)[number];
