'use client';
// client-boundary-reason: owns the analyze mutation, consent state, live stage progress, language-switch translation, and the file/preview lifecycle, and resolves i18n at the client boundary.

import { useCallback, useState } from 'react';

import { normalizeLanguageCode } from '@twinzy/shared';

import { useAppLocale, useAppTranslation } from '@/packages/i18n';

import { composeErrorMessage, resolvePhase } from '../helpers/game-display.helper';
import { extractFailedStage, toFriendlyErrorMessageKey } from '../helpers/game-error.helper';
import { assembleGameViewModel } from '../helpers/game-view-model.assembler';
import { mapFinalResultToView } from '../mappers/game.mapper';
import type { GameResultView, GameViewModel, TranslateMessage } from '../model/game.types';
import { useAnalyzeGameMutation } from '../queries/game.mutations';

import { useAnalyzeRunControl } from './useAnalyzeRunControl.hook';
import { useCameraCapture } from './useCameraCapture.hook';
import { useImageUpload } from './useImageUpload.hook';
import { usePaymentFlow } from './usePaymentFlow.hook';
import { useResultCount } from './useResultCount.hook';
import { useResultTranslation } from './useResultTranslation.hook';
import { useRunRecovery } from './useRunRecovery.hook';
import { useShareCreate } from './useShareCreate.hook';
import { useShareResult } from './useShareResult.hook';
import { useStreamProgress } from './useStreamProgress.hook';

/**
 * The single wiring point for the game flow: composes the upload + camera +
 * share + progress + translation sub-hooks, owns consent and the streaming
 * analyze mutation (localized to the active locale), resolves all dynamic
 * copy, and exposes one {@link GameViewModel} the container spreads into
 * components.
 */
export const useGame = (): GameViewModel => {
  const t = useAppTranslation();
  const translate = useCallback<TranslateMessage>((key, values) => t(key, values), [t]);
  const languageCode = normalizeLanguageCode(useAppLocale());

  const { file, previewUrl, fileErrorKey, onFileChange, acceptFile, clearFile } = useImageUpload();
  const camera = useCameraCapture(acceptFile);
  const { feedbackKey, resetFeedback } = useShareResult();
  const progress = useStreamProgress();
  const { data, error, isPending, isSuccess, isError, analyze, reset } = useAnalyzeGameMutation(
    progress.handlers,
    languageCode,
  );
  const translation = useResultTranslation(data);
  const [consentGiven, setConsentGiven] = useState(false);
  const { resultCount, resultCountOptions, onResultCountChange } = useResultCount();
  const { beginRun, cancelRun } = useAnalyzeRunControl(analyze);
  const payment = usePaymentFlow({ beginRun });

  const onConsentChange = useCallback((checked: boolean): void => {
    setConsentGiven(checked);
  }, []);

  const canAnalyze = file !== undefined && consentGiven && !isPending && !payment.isPaying;

  const onAnalyze = useCallback((): void => {
    if (file === undefined || !consentGiven || isPending || payment.isPaying) {
      return;
    }

    progress.reset();
    payment.beginPaidRun(file, resultCount);
  }, [file, consentGiven, isPending, payment, progress, resultCount]);

  const recovery = useRunRecovery({
    file,
    error,
    isError,
    resultCount,
    beginRun,
    cancelRun,
    reset,
    clearFile,
    resetFeedback,
    resetProgress: progress.reset,
  });

  const resultView: GameResultView | undefined =
    translation.displayResult === undefined
      ? undefined
      : mapFinalResultToView(translation.displayResult, translate);

  const shareText = resultView?.shareText ?? '';
  // The result "Share" button opens the temporary-link modal (copy/native/platform).
  const shareCreate = useShareCreate(translation.displayResult, shareText);

  return assembleGameViewModel({
    translate,
    phase: resolvePhase(isPending, isSuccess, recovery.isRealError, payment.isPaying),
    consentGiven,
    onConsentChange,
    canAnalyze,
    onAnalyze,
    errorMessage: recovery.isRealError
      ? composeErrorMessage(translate, toFriendlyErrorMessageKey(error), extractFailedStage(error))
      : undefined,
    payment,
    paymentPriceLabel: translate('game.paymentTitle'),
    onPaymentError: payment.onError,
    paymentErrorMessage:
      payment.errorKey === undefined
        ? undefined
        : composeErrorMessage(translate, payment.errorKey, undefined),
    resultView,
    recovery,
    progress,
    resultCount,
    resultCountOptions,
    onResultCountChange,
    upload: { file, previewUrl, fileErrorKey, onFileChange, acceptFile, clearFile },
    camera,
    onShareResult: shareCreate.open,
    feedbackKey,
    shareCreate,
    shareText,
    translation,
  });
};
