import {
  CONSENT_FIELD_NAME,
  CONSENT_FIELD_VALUE,
  UPLOAD_FIELD_NAME,
} from '../model/game.constants';

/**
 * Builds the multipart body both the `/game/analyze` and streaming analyze
 * endpoints expect: the image under the upload field and the consent flag. The
 * File is never persisted — it lives only in this in-memory FormData.
 */
export function buildAnalyzeFormData(file: File): FormData {
  const formData = new FormData();
  formData.append(UPLOAD_FIELD_NAME, file, file.name);
  formData.append(CONSENT_FIELD_NAME, CONSENT_FIELD_VALUE);
  return formData;
}
