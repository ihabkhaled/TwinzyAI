/**
 * Stable machine-readable error codes of the public API contract. Values are
 * frozen: clients key their error handling off them, so codes may be added
 * but never renamed or removed. Owned here so the backend (which emits them)
 * and the frontend (which maps them to friendly copy) share one catalog.
 */
export const ErrorCode = {
  InternalError: 'INTERNAL_ERROR',
  ValidationFailed: 'VALIDATION_FAILED',
  RateLimited: 'RATE_LIMITED',
  ConsentRequired: 'CONSENT_REQUIRED',
  FileMissing: 'FILE_MISSING',
  FileTooLarge: 'FILE_TOO_LARGE',
  FileTypeNotAllowed: 'FILE_TYPE_NOT_ALLOWED',
  FileInvalid: 'FILE_INVALID',
  MultipleFilesNotAllowed: 'MULTIPLE_FILES_NOT_ALLOWED',
  VirusScanFailed: 'VIRUS_SCAN_FAILED',
  AiProviderUnavailable: 'AI_PROVIDER_UNAVAILABLE',
  AiRateLimited: 'AI_RATE_LIMITED',
  AiResponseInvalid: 'AI_RESPONSE_INVALID',
  AiResponseUnsafe: 'AI_RESPONSE_UNSAFE',
  AiTimeout: 'AI_TIMEOUT',
  ServerBusy: 'SERVER_BUSY',
  AnalysisCancelled: 'ANALYSIS_CANCELLED',
  PaymentRequired: 'PAYMENT_REQUIRED',
  PaymentOrderInvalid: 'PAYMENT_ORDER_INVALID',
  PaymentProviderUnavailable: 'PAYMENT_PROVIDER_UNAVAILABLE',
  ShareNotFound: 'SHARE_NOT_FOUND',
  SharePayloadTooLarge: 'SHARE_PAYLOAD_TOO_LARGE',
  ShareResultUnsafe: 'SHARE_RESULT_UNSAFE',
  ShareCapacityReached: 'SHARE_CAPACITY_REACHED',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
