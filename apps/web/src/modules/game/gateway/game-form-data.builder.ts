import type { LanguageCodeValue } from '@twinzy/shared';
import {
  PAYMENT_GATEWAY_FIELD_NAME,
  PAYMENT_ORDER_FIELD_NAME,
  PAYMOB_ORDER_FIELD_NAME,
  PAYMOB_TRANSACTION_FIELD_NAME,
} from '@twinzy/shared';

import {
  CONSENT_FIELD_NAME,
  CONSENT_FIELD_VALUE,
  LANGUAGE_FIELD_NAME,
  RESULT_COUNT_FIELD_NAME,
  UPLOAD_FIELD_NAME,
} from '../model/game.constants';
import type { AnalyzePaymentFields } from '../model/game.types';

/** Append whichever gateway's payment binding is present (none on a free run). */
function appendPaymentFields(formData: FormData, payment: AnalyzePaymentFields): void {
  if (payment.paymentGateway !== undefined) {
    formData.append(PAYMENT_GATEWAY_FIELD_NAME, payment.paymentGateway);
  }
  if (payment.paypalOrderId !== undefined) {
    formData.append(PAYMENT_ORDER_FIELD_NAME, payment.paypalOrderId);
  }
  if (payment.paymobOrderId !== undefined) {
    formData.append(PAYMOB_ORDER_FIELD_NAME, String(payment.paymobOrderId));
  }
  if (payment.paymobTransactionId !== undefined) {
    formData.append(PAYMOB_TRANSACTION_FIELD_NAME, String(payment.paymobTransactionId));
  }
}

/**
 * Builds the multipart body both the `/game/analyze` and streaming analyze
 * endpoints expect: the image under the upload field, the consent flag, the
 * active UI language, and the user-selected result count. When the run was paid,
 * the gateway's payment binding is appended so the server can verify it. The
 * File is never persisted — it lives only in this in-memory FormData.
 */
export function buildAnalyzeFormData(
  file: File,
  languageCode: LanguageCodeValue,
  resultCount: number,
  payment?: AnalyzePaymentFields,
): FormData {
  const formData = new FormData();
  formData.append(CONSENT_FIELD_NAME, CONSENT_FIELD_VALUE);
  formData.append(UPLOAD_FIELD_NAME, file, file.name);
  formData.append(LANGUAGE_FIELD_NAME, languageCode);
  formData.append(RESULT_COUNT_FIELD_NAME, String(resultCount));
  if (payment !== undefined) {
    appendPaymentFields(formData, payment);
  }
  return formData;
}
