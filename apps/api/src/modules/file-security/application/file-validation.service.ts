import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import {
  ERROR_MESSAGE_KEY_BY_CODE,
  ErrorCode,
  PayloadTooLargeError,
  ValidationError,
} from '../../../core/errors';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  FILE_ERROR_MESSAGES,
  MIME_TYPE_BY_EXTENSION,
} from '../model/file-security.constants';
import { UnsupportedImageTypeError } from '../model/file-security.errors';
import type { UploadedImageFile } from '../model/upload-file.types';

/**
 * First-line upload checks: presence, single file, size, MIME allowlist,
 * extension allowlist, and extension↔MIME consistency.
 */
@Injectable()
export class FileValidationService {
  public constructor(private readonly config: AppConfigService) {}

  public assertPresent(file: UploadedImageFile | undefined): asserts file is UploadedImageFile {
    if (file === undefined || file.buffer.length === 0) {
      throw new ValidationError(
        FILE_ERROR_MESSAGES.fileMissing,
        ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.FileMissing],
        ErrorCode.FileMissing,
      );
    }
  }

  public assertSize(file: UploadedImageFile): void {
    const tooLarge =
      file.size > this.config.maxImageSizeBytes ||
      file.buffer.length > this.config.maxImageSizeBytes;

    if (tooLarge) {
      throw new PayloadTooLargeError(
        FILE_ERROR_MESSAGES.fileTooLarge,
        ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.FileTooLarge],
        ErrorCode.FileTooLarge,
      );
    }
  }

  public assertAllowedType(file: UploadedImageFile): void {
    const mimeType = file.mimetype.toLowerCase();
    const extension = this.extractExtension(file.originalname);

    const mimeAllowed = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
    const extensionAllowed =
      extension !== undefined &&
      (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(extension);

    if (!mimeAllowed || !extensionAllowed) {
      throw this.typeNotAllowed();
    }

    const expectedMime = MIME_TYPE_BY_EXTENSION[extension as keyof typeof MIME_TYPE_BY_EXTENSION];
    if (expectedMime !== mimeType) {
      throw this.typeNotAllowed();
    }
  }

  private extractExtension(fileName: string): string | undefined {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1 || lastDot === fileName.length - 1) {
      return undefined;
    }
    return fileName.slice(lastDot + 1).toLowerCase();
  }

  private typeNotAllowed(): UnsupportedImageTypeError {
    return new UnsupportedImageTypeError(FILE_ERROR_MESSAGES.typeNotAllowed);
  }
}
