import type { VerdictValue } from '@twinzy/shared';

import type { TranslationKey } from '@/i18n';

/** One extracted trait prepared for display. */
export interface TraitView {
  key: string;
  label: string;
  value: string;
}

/** One final match prepared for display. */
export interface ResultView {
  name: string;
  rank: number;
  scorePercent: number;
  verdict: VerdictValue;
  verdictLabel: string;
  reason: string;
  matchingTraits: string[];
  weakOrUncertainTraits: string[];
}

/** The mapped view model the UI renders — never the raw backend DTO. */
export interface GameResultView {
  traits: TraitView[];
  results: ResultView[];
  fallbackMessage: string;
  disclaimer: string;
  shareText: string;
}

/** Client-side file validation outcome (UX only; backend re-validates). */
export type FileValidationResult =
  | { ok: true }
  | { ok: false; errorKey: TranslationKey };
