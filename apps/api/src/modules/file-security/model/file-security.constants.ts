export {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_IMAGE_SIZE_BYTES as MAX_IMAGE_SIZE_BYTES,
  MIME_TYPE_BY_EXTENSION,
  TEMP_FILE_PREFIX,
} from '@twinzy/shared';

/** Magic-byte signatures per allowed MIME type. */
export const IMAGE_MAGIC_BYTES: Record<string, readonly number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  // WebP: 'RIFF' at 0..3 (bytes 4-7 are the size), 'WEBP' at 8..11 —
  // validated structurally in MagicByteValidationService.
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};

export const WEBP_FORMAT_MARKER = 'WEBP';

export const WEBP_MARKER_OFFSET = 8;

/** Structural decode sanity bounds (pixels). */
export const MIN_IMAGE_DIMENSION_PX = 8;

export const MAX_IMAGE_DIMENSION_PX = 12_000;

export const CLAMAV_TIMEOUT_MS = 10_000;

export const CLAMAV_CHUNK_SIZE_BYTES = 65_536;

/**
 * Well-known clamd hosts the adapter falls back through, in order, when the
 * configured host is unreachable. Covers both runtimes with one config: the
 * `clamav` docker-compose service name (API inside the compose network) and
 * 127.0.0.1 (API on the host reaching a ClamAV container's published port).
 */
export const CLAMAV_FALLBACK_HOSTS = ['clamav', '127.0.0.1'] as const;

export const UPLOAD_FIELD_NAME = 'image';

/** Friendly, safe user messages per rejection. */
export const FILE_ERROR_MESSAGES = {
  consentRequired: 'Please confirm the consent checkbox before playing.',
  fileMissing: 'Please choose a photo first.',
  multipleFiles: 'Please upload just one photo.',
  fileTooLarge: 'That photo is too big. Please pick one under 5 MB.',
  typeNotAllowed: 'Please use a JPG, PNG, or WebP photo.',
  fileInvalid: 'That file does not look like a valid photo. Please try another one.',
  scanFailed: 'We could not safely check that file. Please try again later.',
} as const;
