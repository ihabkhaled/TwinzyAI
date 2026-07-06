import type { FinalGameResult } from '@twinzy/shared';

import { AppError } from '@/shared/errors/app-error';

import { analyzeImageRequest } from '../gateway/game.gateway';
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
