/**
 * Error codes raised by the HTTP platform's multipart plugin. Matched
 * structurally so no vendor types leak outside src/bootstrap.
 */
export const MULTIPART_FILE_TOO_LARGE_ERROR_CODE = 'FST_REQ_FILE_TOO_LARGE';

export const MULTIPART_FILES_LIMIT_ERROR_CODE = 'FST_FILES_LIMIT';

export const MULTIPART_INVALID_CONTENT_TYPE_ERROR_CODE = 'FST_INVALID_MULTIPART_CONTENT_TYPE';

/** Part discriminators used by the multipart plugin's parts() iterator. */
export const MULTIPART_PART_TYPE = {
  File: 'file',
  Field: 'field',
} as const;

export type MultipartPartTypeValue = (typeof MULTIPART_PART_TYPE)[keyof typeof MULTIPART_PART_TYPE];
