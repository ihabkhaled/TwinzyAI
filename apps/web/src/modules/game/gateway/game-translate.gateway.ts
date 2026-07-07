import type { FinalGameResult, LanguageCodeValue } from '@twinzy/shared';
import { TranslateResultResponseSchema } from '@twinzy/shared';

import { httpClient, postJson } from '@/packages/axios';

import {
  AI_TRANSLATE_REQUEST_TIMEOUT_MS,
  GAME_TRANSLATE_RESULT_PATH,
} from '../model/game.constants';

/**
 * Text-only translation HTTP call for language switching: POSTs the EXISTING
 * structured result + target language and returns the localized result. No
 * file field exists on this request by construction — the image is never
 * re-sent and the photo pipeline is never re-run. A generous per-request
 * timeout is applied because real translation runs well past the shared 15s
 * client default (see {@link AI_TRANSLATE_REQUEST_TIMEOUT_MS}).
 */
export const translateResultRequest = (
  result: FinalGameResult,
  targetLanguageCode: LanguageCodeValue,
): Promise<FinalGameResult> =>
  postJson(
    httpClient,
    GAME_TRANSLATE_RESULT_PATH,
    { targetLanguageCode, result },
    TranslateResultResponseSchema,
    { timeout: AI_TRANSLATE_REQUEST_TIMEOUT_MS },
  );
