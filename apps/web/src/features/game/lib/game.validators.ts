import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_IMAGE_SIZE_BYTES,
} from '../model/game.constants';
import type { FileValidationResult } from '../model/game.types';

/**
 * Client-side UX validation only — the backend is the source of truth and
 * re-checks everything (plus magic bytes, decode, and scanning).
 */
export const validateImageFile = (file?: File): FileValidationResult => {
  if (file === undefined) {
    return { ok: false, errorKey: 'error.fileMissing' };
  }

  if (file.size > DEFAULT_MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, errorKey: 'error.fileTooLarge' };
  }

  const mimeAllowed = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(
    file.type.toLowerCase(),
  );
  if (!mimeAllowed) {
    return { ok: false, errorKey: 'error.fileTypeNotAllowed' };
  }

  const extension = extractExtension(file.name);
  const extensionAllowed =
    extension !== undefined && (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(extension);
  if (!extensionAllowed) {
    return { ok: false, errorKey: 'error.fileTypeNotAllowed' };
  }

  return { ok: true };
};

const extractExtension = (fileName: string): string | undefined => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return undefined;
  }
  return fileName.slice(lastDot + 1).toLowerCase();
};
