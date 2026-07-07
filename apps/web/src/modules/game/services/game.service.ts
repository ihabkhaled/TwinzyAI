import type { FinalGameResult, GameStreamStageValue } from '@twinzy/shared';

import { AppError } from '@/shared/errors/app-error';

import { analyzeImageRequest } from '../gateway/game.gateway';
import { analyzeImageStreamRequest } from '../gateway/game-stream.gateway';
import { validateImageFile } from '../helpers/game-validation.helper';
import type { FileValidationResult } from '../model/game.types';

/** UX-only file validation reused by the upload hook and {@link analyzeImage}. */
export const validateFileForUpload = (file: File | undefined): FileValidationResult =>
  validateImageFile(file);

/** Throw a typed {@link AppError} when the file fails client-side validation. */
const assertValidFile = (file: File): void => {
  const validation = validateImageFile(file);
  if (!validation.ok) {
    throw new AppError(validation.errorKey);
  }
};

/**
 * Frontend orchestration (React-free): validate the file for UX, then delegate
 * to the gateway. Consent is asserted by the caller (analyze stays disabled
 * until the box is ticked) and re-checked by the backend regardless.
 */
export const analyzeImage = async (file: File): Promise<FinalGameResult> => {
  assertValidFile(file);
  return analyzeImageRequest(file);
};

/**
 * Streaming orchestration used by the UI: validate the file for UX, then open
 * the SSE analyze request, reporting each pipeline stage through `onStage` as
 * it arrives (so the long call shows live progress and never appears frozen)
 * and resolving with the raw result the query layer maps to the view model.
 */
export const analyzeImageStream = async (
  file: File,
  onStage: (stage: GameStreamStageValue) => void,
): Promise<FinalGameResult> => {
  assertValidFile(file);
  return analyzeImageStreamRequest(file, { onStage });
};
