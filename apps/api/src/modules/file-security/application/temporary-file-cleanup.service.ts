import { Injectable } from '@nestjs/common';

import { AppLogger } from '../../../core/logger';
import type { UploadedImageFile } from '../model/upload-file.types';

const LOG_CONTEXT = 'FileCleanup';

/**
 * Destroys uploaded image data. Uploads use multer memory storage, so
 * there is never a temp file on disk — cleanup means zero-filling the one
 * buffer that exists. Called from the use-case's finally block, so it runs
 * on success AND on every failure path.
 */
@Injectable()
export class TemporaryFileCleanupService {
  public constructor(private readonly logger: AppLogger) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public wipe(file: UploadedImageFile | undefined): void {
    if (file === undefined || file.buffer.length === 0) {
      return;
    }

    file.buffer.fill(0);
    this.logger.debug('Upload buffer zero-filled');
  }
}
