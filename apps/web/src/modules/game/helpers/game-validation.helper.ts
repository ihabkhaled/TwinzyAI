import { ERROR_MESSAGE_KEYS } from '@/shared/errors/error-keys.constants';

import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_IMAGE_SIZE_BYTES,
} from '../model/game.constants';
import type { FileValidationResult } from '../model/game.types';

/** Extract a lower-cased file extension, or `undefined` when there is none. */
const extractExtension = (fileName: string): string | undefined => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return undefined;
  }
  return fileName.slice(lastDot + 1).toLowerCase();
};

const hasAllowedMimeType = (file: File): boolean =>
  (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type.toLowerCase());

const hasAllowedExtension = (file: File): boolean => {
  const extension = extractExtension(file.name);
  return (
    extension !== undefined && (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(extension)
  );
};

/**
 * Client-side UX validation only — the backend is the source of truth and
 * re-checks everything (plus magic bytes, decode, and scanning). Failures are
 * reported as shared {@link ERROR_MESSAGE_KEYS} so the boundary translates them.
 */
export const validateImageFile = (file?: File): FileValidationResult => {
  if (file === undefined) {
    return { ok: false, errorKey: ERROR_MESSAGE_KEYS.validation };
  }
  if (file.size > DEFAULT_MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, errorKey: ERROR_MESSAGE_KEYS.upload };
  }
  if (!hasAllowedMimeType(file) || !hasAllowedExtension(file)) {
    return { ok: false, errorKey: ERROR_MESSAGE_KEYS.upload };
  }
  return { ok: true };
};
