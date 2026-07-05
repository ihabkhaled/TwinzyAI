import type { FinalGameResult } from '@twinzy/shared';

import { postMultipart } from '@/lib/http';

import { GAME_ANALYZE_PATH } from '../model/game.constants';
import { FinalGameResultSchema } from '../model/game.schemas';

const UPLOAD_FIELD = 'image';

const CONSENT_FIELD = 'consent';

/**
 * HTTP only: builds the multipart request and validates the response
 * shape. No business decisions live here.
 */
export const analyzeImageRequest = async (file: File): Promise<FinalGameResult> => {
  const formData = new FormData();
  formData.append(UPLOAD_FIELD, file, file.name);
  formData.append(CONSENT_FIELD, 'true');

  return postMultipart(GAME_ANALYZE_PATH, formData, FinalGameResultSchema);
};
