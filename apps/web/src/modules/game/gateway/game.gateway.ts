import type { FinalGameResult } from '@twinzy/shared';

import { httpClient, postMultipart } from '@/packages/axios';

import { GAME_ANALYZE_PATH } from '../model/game.constants';
import { FinalGameResultSchema } from '../schemas/game.schema';

import { buildAnalyzeFormData } from './game-form-data.builder';

/**
 * HTTP only: posts the image + consent flag as multipart form data and
 * validates the JSON response against the shared contract. No business
 * decisions live here — the service owns validation and orchestration.
 */
export const analyzeImageRequest = async (file: File): Promise<FinalGameResult> =>
  postMultipart(httpClient, GAME_ANALYZE_PATH, buildAnalyzeFormData(file), FinalGameResultSchema);
