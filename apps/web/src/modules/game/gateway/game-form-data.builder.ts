import type { LanguageCodeValue } from '@twinzy/shared';
import { PAYMENT_ORDER_FIELD_NAME } from '@twinzy/shared';

import {
  CONSENT_FIELD_NAME,
  CONSENT_FIELD_VALUE,
  LANGUAGE_FIELD_NAME,
  RESULT_COUNT_FIELD_NAME,
  UPLOAD_FIELD_NAME,
} from '../model/game.constants';

/**
 * Builds the multipart body both the `/game/analyze` and streaming analyze
 * endpoints expect: the image under the upload field, the consent flag, the
 * active UI language, and the user-selected result count. The File is never
 * persisted — it lives only in this in-memory FormData.
 */
export function buildAnalyzeFormData(
  file: File,
  languageCode: LanguageCodeValue,
  resultCount: number,
  paypalOrderId?: string,
): FormData {
  const formData = new FormData();
  formData.append(CONSENT_FIELD_NAME, CONSENT_FIELD_VALUE);
  formData.append(UPLOAD_FIELD_NAME, file, file.name);
  formData.append(LANGUAGE_FIELD_NAME, languageCode);
  formData.append(RESULT_COUNT_FIELD_NAME, String(resultCount));
  if (paypalOrderId !== undefined) {
    formData.append(PAYMENT_ORDER_FIELD_NAME, paypalOrderId);
  }
  return formData;
}
