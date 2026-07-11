/**
 * Canonical i18n message keys for every error class the UI surfaces. Errors are
 * carried as one of these keys (never a raw string) so the presentation layer
 * resolves a translated, safe message at the boundary.
 */
export const ERROR_MESSAGE_KEYS = {
  generic: 'errors.generic',
  network: 'errors.network',
  timeout: 'errors.timeout',
  notFound: 'errors.notFound',
  unauthorized: 'errors.unauthorized',
  forbidden: 'errors.forbidden',
  server: 'errors.server',
  validation: 'errors.validation',
  upload: 'errors.upload',
  safety: 'errors.safety',
  payment: 'errors.payment',
} as const;

export type ErrorMessageKey = (typeof ERROR_MESSAGE_KEYS)[keyof typeof ERROR_MESSAGE_KEYS];
