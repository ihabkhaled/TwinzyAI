import type { RefObject } from 'react';

import type { FinalGameResult, GameStreamStageValue, Traits, VerdictValue } from '@twinzy/shared';

import type { ErrorMessageKey } from '@/shared/errors/error-keys.constants';

import type { GamePhaseValue } from './game.enums';

/** Progress callbacks the streaming analyze request drives as events arrive. */
export interface GameStreamHandlers {
  onStage: (stage: GameStreamStageValue) => void;
  /** The extracted written traits, streamed right after extraction. */
  onTraits?: (traits: Traits) => void;
  /** The candidate public-figure names being considered ("rough examples"). */
  onCandidates?: (names: readonly string[]) => void;
}

/** Live streaming-progress state plus the handlers that drive it and a reset. */
export interface StreamProgressController {
  handlers: GameStreamHandlers;
  currentStage: GameStreamStageValue | undefined;
  traits: Traits | undefined;
  candidateNames: readonly string[];
  reset: () => void;
}

/**
 * The live-camera controller surface the capture hook exposes. Holds the raw
 * error KEY (not translated copy) so the hook stays React-i18n-free, mirroring
 * {@link UploadController}; the orchestrator translates it at the boundary.
 */
export interface CameraController {
  isOpen: boolean;
  isStarting: boolean;
  errorKey: string | undefined;
  videoRef: RefObject<HTMLVideoElement | null>;
  open: () => void;
  cancel: () => void;
  capture: () => void;
}

/** The live-camera sub-view the container renders (error already translated). */
export interface CameraViewModel {
  isOpen: boolean;
  isStarting: boolean;
  errorMessage: string | undefined;
  videoRef: RefObject<HTMLVideoElement | null>;
  onOpen: () => void;
  onCancel: () => void;
  onCapture: () => void;
}

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
  /** Accept a single already-obtained File (from the camera) through the same
   * validation + preview path as a picked upload. */
  acceptFile: (file: File) => void;
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

/** Translated copy for the live-camera capture card. */
export interface CameraLabels {
  title: string;
  previewLabel: string;
  starting: string;
  captureButton: string;
  cancelButton: string;
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
  liveTraitsTitle: string;
  liveCandidatesTitle: string;
  privacyNotice: string;
  upload: UploadLabels;
  camera: CameraLabels;
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
  /** Live progress copy for the streamed pipeline; the generic text until a stage arrives. */
  stageLabel: string;
  /** Extracted traits streamed mid-pipeline (empty until the traits event arrives). */
  liveTraits: TraitView[];
  /** Candidate public-figure names streamed as "rough examples" (empty until they arrive). */
  liveCandidates: string[];
  upload: UploadViewModel;
  camera: CameraViewModel;
  share: ShareViewModel;
}
