'use client';
// client-boundary-reason: owns the analyze mutation, consent state, live stage progress, language-switch translation, and the file/preview lifecycle, and resolves i18n at the client boundary.

import { useCallback, useState } from 'react';

import { normalizeLanguageCode } from '@twinzy/shared';

import { useAppLocale, useAppTranslation } from '@/packages/i18n';

import {
  resolvePhase,
  resolveStageLabel,
  translateOptionalKey,
} from '../helpers/game-display.helper';
import { toFriendlyErrorMessageKey } from '../helpers/game-error.helper';
import { mapFinalResultToView } from '../mappers/game.mapper';
import type { GameResultView, GameViewModel, TranslateMessage } from '../model/game.types';
import { useAnalyzeGameMutation } from '../queries/game.mutations';

import { useCameraCapture } from './useCameraCapture.hook';
import { useImageUpload } from './useImageUpload.hook';
import { useResultTranslation } from './useResultTranslation.hook';
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
  const { feedbackKey, onShare, resetFeedback } = useShareResult();
  const progress = useStreamProgress();
  const { data, error, isPending, isSuccess, isError, analyze, reset } = useAnalyzeGameMutation(
    progress.handlers,
    languageCode,
  );
  const translation = useResultTranslation(data);
  const [consentGiven, setConsentGiven] = useState(false);

  const onConsentChange = useCallback((checked: boolean): void => {
    setConsentGiven(checked);
  }, []);

  const canAnalyze = file !== undefined && consentGiven && !isPending;

  const onAnalyze = useCallback((): void => {
    if (file !== undefined && consentGiven && !isPending) {
      progress.reset();
      analyze(file);
    }
  }, [file, consentGiven, isPending, analyze, progress]);

  const onRetry = useCallback((): void => {
    reset();
    clearFile();
    resetFeedback();
    progress.reset();
  }, [reset, clearFile, resetFeedback, progress]);

  const resultView: GameResultView | undefined =
    translation.displayResult === undefined
      ? undefined
      : mapFinalResultToView(translation.displayResult, translate);

  const shareText = resultView?.shareText ?? '';
  const onShareResult = useCallback((): void => {
    void onShare(shareText);
  }, [onShare, shareText]);

  return {
    phase: resolvePhase(isPending, isSuccess, isError),
    consentGiven,
    onConsentChange,
    canAnalyze,
    onAnalyze,
    onRetry,
    onShareResult,
    resultView,
    errorMessage: isError ? translate(toFriendlyErrorMessageKey(error)) : undefined,
    stageLabel: resolveStageLabel(translate, progress.currentStage),
    liveTraitCount: progress.traitsProgress?.traitCount,
    liveSummary: [...(progress.traitsProgress?.compactTraitSummary ?? [])],
    liveCandidates: [...progress.candidateNames],
    upload: {
      file,
      previewUrl,
      fileError: translateOptionalKey(translate, fileErrorKey),
      onFileChange,
      clearFile,
    },
    camera: {
      isOpen: camera.isOpen,
      isStarting: camera.isStarting,
      errorMessage: translateOptionalKey(translate, camera.errorKey),
      videoRef: camera.videoRef,
      onOpen: camera.open,
      onCancel: camera.cancel,
      onCapture: camera.capture,
    },
    share: {
      feedback: translateOptionalKey(translate, feedbackKey),
    },
    translation: {
      isTranslating: translation.isTranslating,
      errorMessage: translateOptionalKey(translate, translation.errorKey),
    },
  };
};
