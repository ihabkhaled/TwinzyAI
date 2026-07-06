import type { FinalGameResult, VerdictValue } from '@twinzy/shared';

import type { ErrorMessageKey } from '@/shared/errors/error-keys.constants';

import type { GamePhaseValue } from './game.enums';

/**
 * Resolves an i18n message key (optionally with ICU values) to a translated
 * string. Injected into the otherwise React-free mapper/helpers so those pure
 * layers never import an i18n hook.
 */
export type TranslateMessage = (key: string, values?: Record<string, string | number>) => string;

/** One extracted trait prepared for display (label already translated). */
export interface TraitView {
  key: string;
  label: string;
  value: string;
}

/** One final match prepared for display (verdict label already translated). */
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
  hasResults: boolean;
  shareText: string;
}

/**
 * Client-side file validation outcome (UX only; the backend re-validates).
 * The failure key is a shared {@link ErrorMessageKey}, never a raw string.
 */
export type FileValidationResult = { ok: true } | { ok: false; errorKey: ErrorMessageKey };

/** The narrowed analyze-mutation surface the orchestrator hook consumes. */
export interface AnalyzeGameMutation {
  data: FinalGameResult | undefined;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  analyze: (file: File) => void;
  reset: () => void;
}

/** Internal upload-hook surface: preview state plus the raw failure key. */
export interface UploadController {
  file: File | undefined;
  previewUrl: string | undefined;
  fileErrorKey: ErrorMessageKey | undefined;
  onFileChange: (files: FileList | null) => void;
  clearFile: () => void;
}

/** Internal share-hook surface: the "copied" feedback and its actions. */
export interface ShareController {
  feedbackKey: string | undefined;
  onShare: (text: string) => Promise<void>;
  resetFeedback: () => void;
}

/** The selected-image sub-view: the file, its preview, and its handlers. */
export interface UploadViewModel {
  file: File | undefined;
  previewUrl: string | undefined;
  fileError: string | undefined;
  onFileChange: (files: FileList | null) => void;
  clearFile: () => void;
}

/** The share sub-view: the transient "copied" feedback message. */
export interface ShareViewModel {
  feedback: string | undefined;
}

/** Translated copy for the upload/consent card. */
export interface UploadLabels {
  label: string;
  hint: string;
  changeButton: string;
  cameraLabel: string;
  cameraHint: string;
  consentLabel: string;
  previewAlt: string;
}

/** Translated copy for the results view (dynamic values come from the DTO). */
export interface ResultLabels {
  title: string;
  traitsTitle: string;
  scoreLabel: string;
  reasonLabel: string;
  matchingTraitsLabel: string;
  weakTraitsLabel: string;
  rankLabel: string;
  fallbackTitle: string;
  retryButton: string;
  shareButton: string;
}

/** All static copy the game screen needs, resolved once per render. */
export interface GameScreenLabels {
  title: string;
  analyzeButton: string;
  processingText: string;
  processingHint: string;
  privacyNotice: string;
  upload: UploadLabels;
  result: ResultLabels;
}

/** All static copy the landing section needs. */
export interface LandingLabels {
  badge: string;
  tagline: string;
  subtitle: string;
  startButton: string;
  howItWorksTitle: string;
  steps: string[];
  privacyNotice: string;
}

/** The single props object the container spreads across pure components. */
export interface GameViewModel {
  phase: GamePhaseValue;
  consentGiven: boolean;
  onConsentChange: (checked: boolean) => void;
  canAnalyze: boolean;
  onAnalyze: () => void;
  onRetry: () => void;
  onShareResult: () => void;
  resultView: GameResultView | undefined;
  errorMessage: string | undefined;
  upload: UploadViewModel;
  share: ShareViewModel;
}
