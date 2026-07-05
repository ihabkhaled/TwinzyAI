export const Verdict = {
  Strong: 'strong',
  Medium: 'medium',
  Weak: 'weak',
} as const;

export const VERDICT_VALUES = [Verdict.Strong, Verdict.Medium, Verdict.Weak] as const;

export type VerdictValue = (typeof VERDICT_VALUES)[number];
