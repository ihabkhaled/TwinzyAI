import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export const UPLOAD_FIELD_NAME = 'image';

/**
 * Hard transport-level cap (10 MB) — a backstop above the configured
 * business limit (5 MB default) so oversized bodies are cut early while
 * the FileSecurityService still produces the friendly FILE_TOO_LARGE error
 * for anything between the two.
 */
export const UPLOAD_HARD_CAP_BYTES = 10_485_760;

/**
 * Memory storage ONLY: the image must never touch disk. Cleanup is a
 * single buffer zero-fill in the manager's finally block.
 */
export const UPLOAD_MULTER_OPTIONS: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: UPLOAD_HARD_CAP_BYTES,
    files: 1,
  },
};
