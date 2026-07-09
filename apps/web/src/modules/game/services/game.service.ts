import type { FinalGameResult, LanguageCodeValue } from '@twinzy/shared';

import { AppError } from '@/shared/errors/app-error';

import { analyzeImageRequest } from '../gateway/game.gateway';
import { analyzeImageStreamRequest } from '../gateway/game-stream.gateway';
import { translateResultRequest } from '../gateway/game-translate.gateway';
import { validateImageFile } from '../helpers/game-validation.helper';
import type {
  AnalyzeStreamOptions,
  FileValidationResult,
  GameStreamHandlers,
} from '../model/game.types';
import { ResultCountSchema } from '../schemas/game.schema';

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

/** Throw a typed {@link AppError} when the selected result count is out of bounds. */
const assertValidResultCount = (resultCount: number): void => {
  const parsed = ResultCountSchema.safeParse(resultCount);
  if (!parsed.success) {
    throw new AppError('errors.validation');
  }
};

/**
 * Frontend orchestration (React-free): validate the file for UX, then delegate
 * to the gateway with the active language and result count so all dynamic AI
 * output arrives localized and bounded. Consent is asserted by the caller
 * (analyze stays disabled until the box is ticked) and re-checked by the
 * backend regardless.
 */
export const analyzeImage = async (
  file: File,
  languageCode: LanguageCodeValue,
  resultCount: number,
): Promise<FinalGameResult> => {
  assertValidFile(file);
  assertValidResultCount(resultCount);
  return analyzeImageRequest(file, languageCode, resultCount);
};

/**
 * Streaming orchestration used by the UI: validate the file for UX, then open
 * the SSE analyze request, reporting each pipeline stage and intermediate
 * payload through `handlers` as it arrives (so the long call shows live
 * progress and never appears frozen) and resolving with the raw result the
 * query layer maps to the view model.
 */
export const analyzeImageStream = async (
  file: File,
  languageCode: LanguageCodeValue,
  handlers: GameStreamHandlers,
  options: AnalyzeStreamOptions,
): Promise<FinalGameResult> => {
  assertValidFile(file);
  assertValidResultCount(options.resultCount);
  return analyzeImageStreamRequest(file, languageCode, handlers, options);
};

/**
 * Language-switch orchestration: localize an EXISTING result without touching
 * the image pipeline. Pure pass-through to the text-only translate gateway —
 * no file, no re-analysis, names/scores/ranks preserved by the backend.
 */
export const translateResult = (
  result: FinalGameResult,
  targetLanguageCode: LanguageCodeValue,
): Promise<FinalGameResult> => translateResultRequest(result, targetLanguageCode);
