import type { ChangeEventHandler, ReactNode, RefObject } from 'react';

import type {
  GameResultView,
  ResultLabels,
  ResultView,
  TraitCategoryView,
  TraitFieldView,
  UncertaintyGroupView,
} from './game.types';

/** Props for the landing hero (badge, headline, sub-copy, CTA label). */
export interface LandingHeroProps {
  badge: string;
  tagline: string;
  subtitle: string;
  startButton: string;
  testId?: string;
  /** Required: the typed AppLink `data-testid` does not accept `undefined`. */
  ctaTestId: string;
}

/** Props for the "how it works" intro card; steps arrive as ready list items. */
export interface GameIntroProps {
  title: string;
  children: ReactNode;
  testId?: string;
}

/** Props for the privacy reassurance note. */
export interface PrivacyNoticeProps {
  message: string;
  testId?: string;
}

/** Props for the upload / open-camera source card. */
export interface UploadCardProps {
  uploadLabel: string;
  changeButton: string;
  hint: string;
  cameraLabel: string;
  cameraHint: string;
  previewAlt: string;
  previewUrl: string | undefined;
  fileError: string | undefined;
  uploadAccept: string;
  onFileInputChange: ChangeEventHandler<HTMLInputElement>;
  /** Opens the live getUserMedia camera (NOT a file input — see rules/12). */
  onOpenCamera: () => void;
  testId?: string;
}

/** Props for the live-camera capture card (pure: ref + handlers in, JSX out). */
export interface CameraCaptureProps {
  title: string;
  previewLabel: string;
  startingLabel: string;
  captureButton: string;
  cancelButton: string;
  isStarting: boolean;
  errorMessage: string | undefined;
  videoRef: RefObject<HTMLVideoElement | null>;
  onCapture: () => void;
  onCancel: () => void;
  testId?: string;
}

/** Props for the consent checkbox. */
export interface UploadConsentProps {
  consentLabel: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  testId?: string;
}

/** Props for the traits panel; individual trait rows arrive as children. */
export interface TraitListProps {
  title: string;
  children: ReactNode;
  testId?: string;
}

/** Props for one extracted-trait row. */
export interface TraitItemProps {
  label: string;
  value: string;
  testId?: string;
}

/** Props for the matches panel; ranked cards or the fallback arrive here. */
export interface ResultListProps {
  title: string;
  fallbackTitle: string;
  fallbackMessage: string;
  hasResults: boolean;
  children: ReactNode;
  testId?: string;
}

/** Props for one ranked match card (dynamic data + static labels). */
export interface ResultCardProps {
  result: ResultView;
  labels: ResultLabels;
  testId?: string;
}

/** Props for the success-phase result view (ranked matches + traits + actions). */
export interface GameResultProps {
  view: GameResultView;
  labels: ResultLabels;
  traitCountLabel: string;
  translatingLabel: string;
  isTranslating: boolean;
  translationError: string | undefined;
  shareFeedback: string | undefined;
  onShare: () => void;
  onRetry: () => void;
}

/** Props for the compact "strongest signals" summary section. */
export interface ResultSummaryProps {
  title: string;
  traitCountLabel: string;
  summary: string[];
}

/** Props for the grouped detailed-traits accordion. */
export interface TraitDetailsProps {
  title: string;
  categories: TraitCategoryView[];
}

/** Props for the image-quality & uncertainty section. */
export interface ImageQualityProps {
  title: string;
  uncertaintyTitle: string;
  fields: TraitFieldView[];
  uncertainty: UncertaintyGroupView[];
}

/** Props for the safety disclaimer footer. */
export interface ResultDisclaimerProps {
  disclaimer: string;
  testId?: string;
}

/** Props for the share button with its transient "copied" feedback. */
export interface ShareButtonProps {
  label: string;
  feedback: string | undefined;
  onShare: () => void;
  testId?: string;
}

/** Props for the retry / "try another photo" button. */
export interface RetryButtonProps {
  label: string;
  onRetry: () => void;
  testId?: string;
}

/** Props for the processing placeholder card; `stageLabel` is live progress copy. */
export interface ProcessingCardProps {
  stageLabel: string;
  hint: string;
  testId?: string;
}

/** Props for the live processing view (stage + streamed summary + candidate names). */
export interface GameProcessingProps {
  stageLabel: string;
  hint: string;
  traitsTitle: string;
  candidatesTitle: string;
  traitCountLabel: string | undefined;
  summary: string[];
  candidateNames: string[];
}
