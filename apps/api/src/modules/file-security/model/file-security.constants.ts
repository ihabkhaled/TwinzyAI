import { type AllowedImageMimeType, IMAGE_MIME } from '@twinzy/shared';

export {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  type AllowedImageMimeType,
  MIME_TYPE_BY_EXTENSION,
} from '@twinzy/shared';

const JPEG_MAGIC_BYTES: readonly number[] = [0xff, 0xd8, 0xff];
const PNG_MAGIC_BYTES: readonly number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP_MAGIC_BYTES: readonly number[] = [0x52, 0x49, 0x46, 0x46];

/** Magic-byte signatures per allowed MIME type (typed: adding a type can't drift). */
export const IMAGE_MAGIC_BYTES: Record<AllowedImageMimeType, readonly number[]> = {
  [IMAGE_MIME.jpeg]: JPEG_MAGIC_BYTES,
  [IMAGE_MIME.png]: PNG_MAGIC_BYTES,
  // WebP: 'RIFF' at 0..3 (bytes 4-7 are the size), 'WEBP' at 8..11 —
  // validated structurally in MagicByteValidationService.
  [IMAGE_MIME.webp]: WEBP_MAGIC_BYTES,
};

export const WEBP_FORMAT_MARKER = 'WEBP';

export const WEBP_MARKER_OFFSET = 8;

/** Structural decode sanity bounds (pixels). */
export const MIN_IMAGE_DIMENSION_PX = 8;

export const MAX_IMAGE_DIMENSION_PX = 12_000;

export const CLAMAV_TIMEOUT_MS = 10_000;

export const CLAMAV_CHUNK_SIZE_BYTES = 65_536;

export const CLAMAV_SIZE_PREFIX_LENGTH_BYTES = 4;

export const CLAMAV_TERMINAL_CHUNK_LENGTH_BYTES = 4;

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
