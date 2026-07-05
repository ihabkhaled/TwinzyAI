import { t } from '@/i18n';
import { HttpClientError } from '@/lib/http';

import { ERROR_MESSAGE_KEYS } from '../model/game.constants';

/** Maps any thrown error to a friendly, safe, i18n user message. */
export const toFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof HttpClientError) {
    const key = ERROR_MESSAGE_KEYS[error.errorCode];
    if (key !== undefined) {
      return t(key);
    }
  }
  return t('error.generic');
};
