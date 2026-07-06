import type { ErrorMessageKey } from './error.types';
import { ErrorCode, type ErrorCodeValue } from './error-code.constants';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const GENERIC_ERROR_MESSAGE_KEY: ErrorMessageKey = 'errors.common.internalError';

export const VALIDATION_FAILED_MESSAGE = 'Request validation failed';
export const VALIDATION_FAILED_MESSAGE_KEY: ErrorMessageKey = 'errors.validation.failed';

export const RATE_LIMIT_MESSAGE = 'Too many requests. Please wait a moment and try again.';

export const FILE_TOO_LARGE_MESSAGE = 'That photo is too big. Please pick one under 5 MB.';

export const ONE_FILE_MESSAGE = 'Please upload just one photo.';

/**
 * Legacy transport-layer message markers: Nest re-wraps unexpected-field and
 * too-many-files upload errors into HttpExceptions carrying these phrases.
 */
export const UNEXPECTED_FIELD_MESSAGE_MARKER = 'Unexpected field';
export const TOO_MANY_FILES_MESSAGE_MARKER = 'Too many files';

/**
 * Derives the i18n-ready messageKey for every stable legacy error code so
 * the mapper can enrich any legacy DomainException additively.
 */
export const ERROR_MESSAGE_KEY_BY_CODE: Readonly<Record<ErrorCodeValue, ErrorMessageKey>> = {
  [ErrorCode.InternalError]: 'errors.common.internalError',
  [ErrorCode.ValidationFailed]: 'errors.validation.failed',
  [ErrorCode.RateLimited]: 'errors.common.rateLimited',
  [ErrorCode.ConsentRequired]: 'errors.upload.consentRequired',
  [ErrorCode.FileMissing]: 'errors.upload.fileMissing',
  [ErrorCode.FileTooLarge]: 'errors.upload.fileTooLarge',
  [ErrorCode.FileTypeNotAllowed]: 'errors.upload.fileTypeNotAllowed',
  [ErrorCode.FileInvalid]: 'errors.upload.fileInvalid',
  [ErrorCode.MultipleFilesNotAllowed]: 'errors.upload.multipleFilesNotAllowed',
  [ErrorCode.VirusScanFailed]: 'errors.upload.virusScanFailed',
  [ErrorCode.AiProviderUnavailable]: 'errors.ai.providerUnavailable',
  [ErrorCode.AiRateLimited]: 'errors.ai.rateLimited',
  [ErrorCode.AiResponseInvalid]: 'errors.ai.responseInvalid',
  [ErrorCode.AiResponseUnsafe]: 'errors.ai.responseUnsafe',
  [ErrorCode.AiTimeout]: 'errors.ai.timeout',
};
