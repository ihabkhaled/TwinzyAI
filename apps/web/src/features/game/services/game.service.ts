import type { GameStreamStageValue } from '@twinzy/shared';

import { t } from '@/i18n';

import { analyzeImageRequest, analyzeImageStreamRequest } from '../gateways/game.gateway';
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
  assertValid(file);
  const result = await analyzeImageRequest(file);
  return mapFinalResultToView(result);
};

/**
 * Streaming variant used by the UI: reports each pipeline stage through
 * onStage as it happens (so the long call shows live progress and never
 * appears frozen) and resolves with the mapped view model.
 */
export const analyzeImageStreaming = async (
  file: File,
  onStage: (stage: GameStreamStageValue) => void,
): Promise<GameResultView> => {
  assertValid(file);
  const result = await analyzeImageStreamRequest(file, { onStage });
  return mapFinalResultToView(result);
};

const assertValid = (file: File): void => {
  const validation = validateImageFile(file);
  if (!validation.ok) {
    throw new Error(t(validation.errorKey));
  }
};

export const validateFileForUpload = (file: File | undefined): FileValidationResult =>
  validateImageFile(file);
