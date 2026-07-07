import type { FinalGameResult, LanguageCodeValue } from '@twinzy/shared';

import { httpClient, postMultipart } from '@/packages/axios';

import { GAME_ANALYZE_PATH } from '../model/game.constants';
import { FinalGameResultSchema } from '../schemas/game.schema';

import { buildAnalyzeFormData } from './game-form-data.builder';

/**
 * HTTP only: posts the image + consent flag + active language as multipart
 * form data and validates the JSON response against the shared contract. No
 * business decisions live here — the service owns validation and orchestration.
 */
export const analyzeImageRequest = async (
  file: File,
  languageCode: LanguageCodeValue,
): Promise<FinalGameResult> =>
  postMultipart(
    httpClient,
    GAME_ANALYZE_PATH,
    buildAnalyzeFormData(file, languageCode),
    FinalGameResultSchema,
  );
