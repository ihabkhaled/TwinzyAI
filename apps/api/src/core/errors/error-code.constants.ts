/**
 * Stable machine-readable error codes of the public API contract. Values are
 * frozen: clients key their error handling off them, so codes may be added
 * but never renamed or removed.
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
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
