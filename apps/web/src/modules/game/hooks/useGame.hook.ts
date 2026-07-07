'use client';
// client-boundary-reason: owns the analyze mutation, consent state, live stage progress, and the file/preview lifecycle, and resolves i18n at the client boundary.

import { useCallback, useState } from 'react';

import type { GameStreamStageValue } from '@twinzy/shared';

import { useAppTranslation } from '@/packages/i18n';

import { resolvePhase, resolveStageLabel } from '../helpers/game-display.helper';
import { toFriendlyErrorMessageKey } from '../helpers/game-error.helper';
import { mapFinalResultToView } from '../mappers/game.mapper';
import type { GameResultView, GameViewModel, TranslateMessage } from '../model/game.types';
import { useAnalyzeGameMutation } from '../queries/game.mutations';

import { useCameraCapture } from './useCameraCapture.hook';
import { useImageUpload } from './useImageUpload.hook';
import { useShareResult } from './useShareResult.hook';

/**
 * The single wiring point for the game flow: composes the upload + share
 * sub-hooks, owns consent, the streaming analyze mutation and its live stage,
 * resolves all dynamic copy, and exposes one {@link GameViewModel} the container
 * spreads into components.
 */
export const useGame = (): GameViewModel => {
  const t = useAppTranslation();
  const translate = useCallback<TranslateMessage>((key, values) => t(key, values), [t]);

  const { file, previewUrl, fileErrorKey, onFileChange, acceptFile, clearFile } = useImageUpload();
  const camera = useCameraCapture(acceptFile);
  const { feedbackKey, onShare, resetFeedback } = useShareResult();
  const [currentStage, setCurrentStage] = useState<GameStreamStageValue | undefined>();
  const onStage = useCallback((stage: GameStreamStageValue): void => {
    setCurrentStage(stage);
  }, []);
  const { data, error, isPending, isSuccess, isError, analyze, reset } =
    useAnalyzeGameMutation(onStage);
  const [consentGiven, setConsentGiven] = useState(false);

  const onConsentChange = useCallback((checked: boolean): void => {
    setConsentGiven(checked);
  }, []);

  const canAnalyze = file !== undefined && consentGiven && !isPending;

  const onAnalyze = useCallback((): void => {
    if (file !== undefined && consentGiven && !isPending) {
      setCurrentStage(undefined);
      analyze(file);
    }
  }, [file, consentGiven, isPending, analyze]);

  const onRetry = useCallback((): void => {
    reset();
    clearFile();
    resetFeedback();
    setCurrentStage(undefined);
  }, [reset, clearFile, resetFeedback]);

  const resultView: GameResultView | undefined =
    data === undefined ? undefined : mapFinalResultToView(data, translate);

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
    stageLabel: resolveStageLabel(translate, currentStage),
    upload: {
      file,
      previewUrl,
      fileError: fileErrorKey === undefined ? undefined : translate(fileErrorKey),
      onFileChange,
      clearFile,
    },
    camera: {
      isOpen: camera.isOpen,
      isStarting: camera.isStarting,
      errorMessage: camera.errorKey === undefined ? undefined : translate(camera.errorKey),
      videoRef: camera.videoRef,
      onOpen: camera.open,
      onCancel: camera.cancel,
      onCapture: camera.capture,
    },
    share: {
      feedback: feedbackKey === undefined ? undefined : translate(feedbackKey),
    },
  };
};
