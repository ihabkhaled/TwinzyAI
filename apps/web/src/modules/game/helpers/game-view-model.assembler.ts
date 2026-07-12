import type { GamePhaseValue } from '../model/game.enums';
import type {
  CameraController,
  GameResultView,
  GameViewModel,
  StreamProgressController,
  TranslateMessage,
  UploadController,
} from '../model/game.types';
import type { PaymentFlowController } from '../model/payment-flow.types';

import { resolveStageLabel } from './game-display.helper';
import {
  buildCameraViewModel,
  buildShareViewModel,
  buildTranslationViewModel,
  buildUploadViewModel,
} from './game-view-model.helper';
import { buildPaymentViewModel } from './payment-view-model.helper';
import { buildShareModalViewModel } from './share-view-model.helper';

/**
 * Everything {@link assembleGameViewModel} needs, prepared by the game hook.
 * Keeping the assembly here holds `useGame` to a readable wiring point (rules
 * on hook length) while this file owns the flat {@link GameViewModel} shape.
 */
export interface GameViewModelInput {
  translate: TranslateMessage;
  phase: GamePhaseValue;
  consentGiven: boolean;
  onConsentChange: (checked: boolean) => void;
  canAnalyze: boolean;
  onAnalyze: () => void;
  errorMessage: string | undefined;
  payment: PaymentFlowController;
  onPaymentError: (error: unknown) => void;
  paymentErrorMessage: string | undefined;
  resultView: GameResultView | undefined;
  recovery: {
    onRetry: () => void;
    onCancelProcessing: () => void;
    canRetrySamePhoto: boolean;
    onRetrySamePhoto: () => void;
  };
  progress: StreamProgressController;
  resultCount: number;
  resultCountOptions: readonly number[];
  onResultCountChange: (count: number) => void;
  upload: UploadController & { previewUrl: string | undefined };
  camera: CameraController;
  onShareResult: () => void;
  feedbackKey: string | undefined;
  shareCreate: Parameters<typeof buildShareModalViewModel>[0];
  shareText: string;
  translation: Parameters<typeof buildTranslationViewModel>[0];
}

/** Compose the flat view model the container spreads across pure components. */
export const assembleGameViewModel = (input: GameViewModelInput): GameViewModel => ({
  phase: input.phase,
  consentGiven: input.consentGiven,
  onConsentChange: input.onConsentChange,
  canAnalyze: input.canAnalyze,
  onAnalyze: input.onAnalyze,
  onRetry: input.recovery.onRetry,
  onShareResult: input.onShareResult,
  resultView: input.resultView,
  errorMessage: input.errorMessage,
  payment: buildPaymentViewModel({
    flow: input.payment,
    onError: input.onPaymentError,
  }),
  paymentErrorMessage: input.paymentErrorMessage,
  onCancelProcessing: input.recovery.onCancelProcessing,
  canRetrySamePhoto: input.recovery.canRetrySamePhoto,
  onRetrySamePhoto: input.recovery.onRetrySamePhoto,
  stageLabel: resolveStageLabel(input.translate, input.progress.currentStage),
  liveTraitCount: input.progress.traitsProgress?.traitCount,
  liveSummary: [...(input.progress.traitsProgress?.compactTraitSummary ?? [])],
  liveCandidates: [...input.progress.candidateNames],
  resultCount: input.resultCount,
  resultCountOptions: [...input.resultCountOptions],
  onResultCountChange: input.onResultCountChange,
  upload: buildUploadViewModel(
    {
      file: input.upload.file,
      onFileChange: input.upload.onFileChange,
      clearFile: input.upload.clearFile,
      fileErrorKey: input.upload.fileErrorKey,
    },
    input.upload.previewUrl,
    input.translate,
  ),
  camera: buildCameraViewModel(input.camera, input.translate),
  share: buildShareViewModel({ feedbackKey: input.feedbackKey }, input.translate),
  shareModal: buildShareModalViewModel(input.shareCreate, input.shareText, input.translate),
  translation: buildTranslationViewModel(input.translation, input.translate),
});
