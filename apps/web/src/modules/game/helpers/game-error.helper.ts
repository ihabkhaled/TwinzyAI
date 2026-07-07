import { isRecord } from '@twinzy/shared';

import { isHttpError } from '@/packages/axios';
import { isAppError } from '@/shared/errors/app-error';
import type { ErrorMessageKey } from '@/shared/errors/error-keys.constants';
import { mapErrorToMessageKey } from '@/shared/errors/http-error-to-message-key.mapper';

import { GAME_ERROR_KEY_BY_CODE, type GameErrorMessageKey } from '../model/game.constants';

/** Read a backend stable error code off an {@link isHttpError} response body. */
const extractBackendErrorCode = (error: unknown): string | undefined => {
  if (!isHttpError(error)) {
    return undefined;
  }
  const body = error.responseBody;
  if (isRecord(body) && typeof body['errorCode'] === 'string') {
    return body['errorCode'];
  }
  return undefined;
};

/**
 * Resolve any thrown value to the i18n message key the UI should show. An
 * {@link AppError} (client-side validation) carries its own key; a transport or
 * stream error carrying a backend `errorCode` maps through
 * {@link GAME_ERROR_KEY_BY_CODE} to its friendly per-code copy (consent,
 * rate-limit, AI-unavailable); everything else is classified by the shared
 * HTTP-error mapper. Nothing unsafe from the backend is ever surfaced verbatim.
 */
export const toFriendlyErrorMessageKey = (
  error: unknown,
): ErrorMessageKey | GameErrorMessageKey => {
  if (isAppError(error)) {
    return error.messageKey;
  }
  const code = extractBackendErrorCode(error);
  if (code !== undefined) {
    const mapped = GAME_ERROR_KEY_BY_CODE[code];
    if (mapped !== undefined) {
      return mapped;
    }
  }
  return mapErrorToMessageKey(error);
};
