export const DEFAULT_MAX_IMAGE_SIZE_BYTES = 5_242_880;

/** Absolute transport ceiling; configured application limits cannot exceed it. */
export const UPLOAD_TRANSPORT_HARD_CAP_BYTES = 10_485_760;

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** Named members of the allowed set, for drift-proof comparisons. */
export const IMAGE_MIME = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const satisfies Record<string, AllowedImageMimeType>;

/**
 * Multipart field name of the analyze upload wire contract — the client's
 * FormData builder and any server-side field handling must agree on it.
 */
export const UPLOAD_FIELD_NAME = 'image';

/** Consent must precede the file part so the backend never buffers first. */
export const UPLOAD_CONSENT_FIELD_NAME = 'consent';

export const UPLOAD_CONSENT_GRANTED_VALUE = 'true';

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export const MIME_TYPE_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

export const TEMP_FILE_PREFIX = 'twinzy-upload-';
