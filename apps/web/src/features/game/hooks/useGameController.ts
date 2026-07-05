'use client';

import { useMutation } from '@tanstack/react-query';
import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';

import { toFriendlyErrorMessage } from '../lib/game.guards';
import type { GamePhaseValue } from '../model/game.enums';
import { GamePhase } from '../model/game.enums';
import { GAME_MUTATION_KEY } from '../model/game.query-keys';
import type { GameResultView } from '../model/game.types';
import { analyzeImage } from '../services/game.service';

import type { GameResultController } from './useGameResultController';
import { useGameResultController } from './useGameResultController';
import type { ImageUploadController } from './useImageUploadController';
import { useImageUploadController } from './useImageUploadController';

export interface GameController {
  phase: GamePhaseValue;
  consentGiven: boolean;
  onConsentInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  canAnalyze: boolean;
  onAnalyze: () => void;
  onRetry: () => void;
  onShareResult: () => void;
  result: GameResultView | undefined;
  errorMessage: string | undefined;
  upload: ImageUploadController;
  share: GameResultController;
}

const resolvePhase = (
  isPending: boolean,
  isSuccess: boolean,
  isError: boolean,
): GamePhaseValue => {
  if (isPending) {
    return GamePhase.Processing;
  }
  if (isSuccess) {
    return GamePhase.Success;
  }
  if (isError) {
    return GamePhase.Error;
  }
  return GamePhase.Setup;
};

/**
 * The single wiring point for the game flow: composes upload + share
 * controllers, owns consent and the analyze mutation, and exposes one
 * props object the page container spreads into pure components.
 */
export const useGameController = (): GameController => {
  const upload = useImageUploadController();
  const share = useGameResultController();
  const [consentGiven, setConsentGiven] = useState(false);

  const mutation = useMutation<GameResultView, unknown, File>({
    mutationKey: GAME_MUTATION_KEY,
    mutationFn: analyzeImage,
  });

  const onConsentInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setConsentGiven(event.target.checked);
  }, []);

  const onAnalyze = useCallback(() => {
    if (upload.file !== undefined && consentGiven && !mutation.isPending) {
      mutation.mutate(upload.file);
    }
  }, [upload.file, consentGiven, mutation]);

  const onRetry = useCallback(() => {
    mutation.reset();
    upload.clearFile();
    share.resetShareFeedback();
  }, [mutation, upload, share]);

  const onShareResult = useCallback(() => {
    const text = mutation.data?.shareText ?? '';
    void share.onShare(text);
  }, [mutation.data, share]);

  return {
    phase: resolvePhase(mutation.isPending, mutation.isSuccess, mutation.isError),
    consentGiven,
    onConsentInputChange,
    canAnalyze: upload.file !== undefined && consentGiven && !mutation.isPending,
    onAnalyze,
    onRetry,
    onShareResult,
    result: mutation.data,
    errorMessage: mutation.isError ? toFriendlyErrorMessage(mutation.error) : undefined,
    upload,
    share,
  };
};
