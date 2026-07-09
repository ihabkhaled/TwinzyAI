'use client';
// client-boundary-reason: owns the error-recovery callbacks (retry, retry-same-photo, cancel) around the analyze mutation's browser state.

import { useCallback } from 'react';

import { isCancelledRunError, isTransientGameError } from '../helpers/game-error.helper';
import type { RunRecoveryController, RunRecoveryDeps } from '../model/game.types';

/**
 * Error/cancel recovery around one analyze run: classifies a cancelled run as
 * NOT an error (the UI returns to setup with the photo kept), offers the
 * non-destructive same-photo retry for transient failures, the destructive
 * try-another-photo reset, and the mid-processing cancel.
 */
export const useRunRecovery = (deps: RunRecoveryDeps): RunRecoveryController => {
  const { file, error, isError, resultCount } = deps;

  const isCancelled = isError && isCancelledRunError(error);
  const isRealError = isError && !isCancelled;
  const canRetrySamePhoto = isRealError && file !== undefined && isTransientGameError(error);

  const onRetry = useCallback((): void => {
    deps.cancelRun();
    deps.reset();
    deps.clearFile();
    deps.resetFeedback();
    deps.resetProgress();
  }, [deps]);

  const onRetrySamePhoto = useCallback((): void => {
    if (file !== undefined) {
      deps.reset();
      deps.resetFeedback();
      deps.resetProgress();
      deps.beginRun(file, resultCount);
    }
  }, [deps, file, resultCount]);

  const onCancelProcessing = useCallback((): void => {
    deps.cancelRun();
    deps.resetProgress();
  }, [deps]);

  return { isRealError, canRetrySamePhoto, onRetry, onRetrySamePhoto, onCancelProcessing };
};
