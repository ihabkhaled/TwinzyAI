import {
  ERROR_MESSAGE_KEY_BY_CODE,
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
  MultipartFileLike,
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

const collectParts = async (request: MultipartRequestLike): Promise<UploadedImagePayload> => {
  let file: ParsedUploadedFile | undefined;
  const body: Record<string, unknown> = {};

  for await (const part of request.parts()) {
    if (part.type === MULTIPART_PART_TYPE.File) {
      if (file !== undefined) {
        throw multipleFilesError();
      }
      file = await bufferFilePart(part);
      continue;
    }
    body[part.fieldname] = part.value;
  }

  return { file, body };
};

/**
 * Streams the multipart request into memory only: exactly one file (extra
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
