import type { LanguageCodeValue } from '@twinzy/shared';

import { buildIntegrationError, ErrorCode } from '../../../core/errors';
import { AI_INVALID_RESPONSE_MESSAGE } from '../model/gemini.constants';

/** Reject an AI response that did not honor the requested output language. */
export const assertResponseLanguage = (
  returned: LanguageCodeValue,
  requested: LanguageCodeValue,
): void => {
  if (returned !== requested) {
    throw buildIntegrationError(ErrorCode.AiResponseInvalid, AI_INVALID_RESPONSE_MESSAGE);
  }
};
