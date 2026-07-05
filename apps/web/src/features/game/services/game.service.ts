import { t } from '@/i18n';

import { analyzeImageRequest } from '../gateways/game.gateway';
import { mapFinalResultToView } from '../lib/game.mappers';
import { validateImageFile } from '../lib/game.validators';
import type { FileValidationResult, GameResultView } from '../model/game.types';

/**
 * Frontend business orchestration: validate for UX, call the gateway,
 * map the DTO to the view model. Consent is asserted by the caller (the
 * hook disables analyze until the box is ticked) and re-checked by the
 * backend regardless.
 */
export const analyzeImage = async (file: File): Promise<GameResultView> => {
  const validation = validateImageFile(file);
  if (!validation.ok) {
    throw new Error(t(validation.errorKey));
  }

  const result = await analyzeImageRequest(file);
  return mapFinalResultToView(result);
};

export const validateFileForUpload = (file: File | undefined): FileValidationResult =>
  validateImageFile(file);
