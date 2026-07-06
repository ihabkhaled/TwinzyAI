import { isAppError } from '@/shared/errors/app-error';
import type { ErrorMessageKey } from '@/shared/errors/error-keys.constants';
import { mapErrorToMessageKey } from '@/shared/errors/http-error-to-message-key.mapper';

/**
 * Resolve any thrown value to the i18n {@link ErrorMessageKey} the UI should
 * show. An {@link AppError} (client-side validation) carries its own key;
 * transport failures are classified by the shared HTTP-error mapper. Nothing
 * unsafe from the backend is ever surfaced verbatim.
 */
export const toFriendlyErrorMessageKey = (error: unknown): ErrorMessageKey => {
  if (isAppError(error)) {
    return error.messageKey;
  }
  return mapErrorToMessageKey(error);
};
