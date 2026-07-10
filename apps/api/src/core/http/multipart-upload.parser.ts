import {
  UPLOAD_CONSENT_FIELD_NAME,
  UPLOAD_CONSENT_GRANTED_VALUE,
  UPLOAD_FIELD_NAME,
} from '@twinzy/shared';

import {
  CONSENT_REQUIRED_MESSAGE,
  ERROR_MESSAGE_KEY_BY_CODE,
  EXPECTED_FILE_FIELD_MESSAGE,
  FILE_TOO_LARGE_MESSAGE,
  ONE_FILE_MESSAGE,
} from '../errors/error.constants';
import { ErrorCode } from '../errors/error-code.constants';
import { PayloadTooLargeError } from '../errors/payload-too-large.error';
import { ValidationError } from '../errors/validation.error';

import {
  MULTIPART_FILE_TOO_LARGE_ERROR_CODE,
  MULTIPART_FILES_LIMIT_ERROR_CODE,
  MULTIPART_INVALID_CONTENT_TYPE_ERROR_CODE,
  MULTIPART_PART_TYPE,
} from './multipart.constants';
import type {
  MultipartCollectionState,
  MultipartFieldLike,
  MultipartFileLike,
  MultipartPartLike,
  MultipartRequestLike,
  ParsedUploadedFile,
  UploadedImagePayload,
} from './multipart.types';

const EMPTY_PAYLOAD: UploadedImagePayload = { file: undefined, body: {} };

const multipleFilesError = (): ValidationError =>
  new ValidationError(
    ONE_FILE_MESSAGE,
    ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.MultipleFilesNotAllowed],
    ErrorCode.MultipleFilesNotAllowed,
  );

const fileTooLargeError = (): PayloadTooLargeError =>
  new PayloadTooLargeError(
    FILE_TOO_LARGE_MESSAGE,
    ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.FileTooLarge],
    ErrorCode.FileTooLarge,
  );

const consentRequiredError = (): ValidationError =>
  new ValidationError(
    CONSENT_REQUIRED_MESSAGE,
    ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.ConsentRequired],
    ErrorCode.ConsentRequired,
  );

const unexpectedFileFieldError = (): ValidationError =>
  new ValidationError(
    EXPECTED_FILE_FIELD_MESSAGE,
    ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.FileMissing],
    ErrorCode.FileMissing,
  );

const readErrorCode = (error: unknown): unknown =>
  error instanceof Error ? (error as Partial<Record<'code', unknown>>).code : undefined;

const bufferFilePart = async (part: MultipartFileLike): Promise<ParsedUploadedFile> => {
  const buffer = await part.toBuffer();
  return {
    originalname: part.filename,
    mimetype: part.mimetype,
    size: buffer.length,
    buffer,
  };
};

const collectFieldPart = (part: MultipartFieldLike, state: MultipartCollectionState): void => {
  state.body[part.fieldname] = part.value;
  if (part.fieldname !== UPLOAD_CONSENT_FIELD_NAME) {
    return;
  }
  if (part.value !== UPLOAD_CONSENT_GRANTED_VALUE) {
    throw consentRequiredError();
  }
  state.hasConsent = true;
};

const collectFilePart = async (
  part: MultipartFileLike,
  state: MultipartCollectionState,
): Promise<void> => {
  if (!state.hasConsent) {
    throw consentRequiredError();
  }
  if (part.fieldname !== UPLOAD_FIELD_NAME) {
    throw unexpectedFileFieldError();
  }
  if (state.file !== undefined) {
    throw multipleFilesError();
  }
  state.file = await bufferFilePart(part);
};

const collectPart = async (
  part: MultipartPartLike,
  state: MultipartCollectionState,
): Promise<void> => {
  if (part.type === MULTIPART_PART_TYPE.File) {
    await collectFilePart(part, state);
    return;
  }
  collectFieldPart(part, state);
};

const collectParts = async (request: MultipartRequestLike): Promise<UploadedImagePayload> => {
  const state: MultipartCollectionState = { file: undefined, hasConsent: false, body: {} };

  try {
    for await (const part of request.parts()) {
      await collectPart(part, state);
    }
    return { file: state.file, body: state.body };
  } catch (error: unknown) {
    state.file?.buffer.fill(0);
    throw error;
  }
};

/**
 * Streams multipart in wire order: explicit consent must arrive before the
 * canonical image field is buffered. Exactly one file is accepted (extra
 * files are rejected with the legacy MULTIPLE_FILES_NOT_ALLOWED envelope,
 * oversize files with FILE_TOO_LARGE) plus the text fields. A missing file
 * stays undefined so the downstream use case produces its own error, and a
 * non-multipart request degrades to an empty payload the same way the
 * previous transport stack did.
 */
export const parseMultipartUpload = async (
  request: MultipartRequestLike,
): Promise<UploadedImagePayload> => {
  try {
    return await collectParts(request);
  } catch (error: unknown) {
    const code = readErrorCode(error);
    if (code === MULTIPART_FILES_LIMIT_ERROR_CODE) {
      throw multipleFilesError();
    }
    if (code === MULTIPART_FILE_TOO_LARGE_ERROR_CODE) {
      throw fileTooLargeError();
    }
    if (code === MULTIPART_INVALID_CONTENT_TYPE_ERROR_CODE) {
      return EMPTY_PAYLOAD;
    }
    throw error;
  }
};
