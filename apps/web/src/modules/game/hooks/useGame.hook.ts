'use client';
// client-boundary-reason: owns the analyze mutation, consent state, live stage progress, language-switch translation, and the file/preview lifecycle, and resolves i18n at the client boundary.

import { useCallback, useState } from 'react';

import { normalizeLanguageCode } from '@twinzy/shared';

import { useAppLocale, useAppTranslation } from '@/packages/i18n';

import { resolvePhase, resolveStageLabel } from '../helpers/game-display.helper';
import { toFriendlyErrorMessageKey } from '../helpers/game-error.helper';
import {
  buildCameraViewModel,
  buildShareViewModel,
  buildTranslationViewModel,
  buildUploadViewModel,
} from '../helpers/game-view-model.helper';
import { mapFinalResultToView } from '../mappers/game.mapper';
import type { GameResultView, GameViewModel, TranslateMessage } from '../model/game.types';
import { useAnalyzeGameMutation } from '../queries/game.mutations';

import { useAnalyzeRunControl } from './useAnalyzeRunControl.hook';
import { useCameraCapture } from './useCameraCapture.hook';
import { useImageUpload } from './useImageUpload.hook';
import { useResultCount } from './useResultCount.hook';
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
  const { resultCount, resultCountOptions, onResultCountChange } = useResultCount();
  const { beginRun, cancelRun } = useAnalyzeRunControl(analyze);

  const onConsentChange = useCallback((checked: boolean): void => {
    setConsentGiven(checked);
  }, []);

  const canAnalyze = file !== undefined && consentGiven && !isPending;

  const onAnalyze = useCallback((): void => {
    if (file !== undefined && consentGiven && !isPending) {
      progress.reset();
      beginRun(file, resultCount);
    }
  }, [file, consentGiven, isPending, beginRun, progress, resultCount]);

  const onRetry = useCallback((): void => {
    cancelRun();
    reset();
    clearFile();
    resetFeedback();
    progress.reset();
  }, [cancelRun, reset, clearFile, resetFeedback, progress]);

  const resultView: GameResultView | undefined =
    translation.displayResult === undefined
      ? undefined
      : mapFinalResultToView(translation.displayResult, translate);

  const onShareResult = useCallback((): void => {
    void onShare(resultView?.shareText ?? '');
  }, [onShare, resultView]);

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
    resultCount,
    resultCountOptions: [...resultCountOptions],
    onResultCountChange,
    upload: buildUploadViewModel(
      { file, onFileChange, clearFile, fileErrorKey },
      previewUrl,
      translate,
    ),
    camera: buildCameraViewModel(camera, translate),
    share: buildShareViewModel({ feedbackKey }, translate),
    translation: buildTranslationViewModel(translation, translate),
  };
};
