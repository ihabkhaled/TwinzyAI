import type { FinalGameResult } from '@twinzy/shared';

import { httpClient, postMultipart } from '@/packages/axios';

import {
  CONSENT_FIELD_NAME,
  CONSENT_FIELD_VALUE,
  GAME_ANALYZE_PATH,
  UPLOAD_FIELD_NAME,
} from '../model/game.constants';
import { FinalGameResultSchema } from '../schemas/game.schema';

/** Builds the multipart body the backend `/game/analyze` endpoint expects. */
const buildFormData = (file: File): FormData => {
  const formData = new FormData();
  formData.append(UPLOAD_FIELD_NAME, file, file.name);
  formData.append(CONSENT_FIELD_NAME, CONSENT_FIELD_VALUE);
  return formData;
};

/**
 * HTTP only: posts the image + consent flag as multipart form data and
 * validates the JSON response against the shared contract. No business
 * decisions live here — the service owns validation and orchestration.
 */
export const analyzeImageRequest = async (file: File): Promise<FinalGameResult> =>
  postMultipart(httpClient, GAME_ANALYZE_PATH, buildFormData(file), FinalGameResultSchema);
