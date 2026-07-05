import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { AppConfigService } from '../../../config/app-config.service';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  FILE_ERROR_MESSAGES,
  MIME_TYPE_BY_EXTENSION,
} from '../constants/file-security.constants';
import type { UploadedImageFile } from '../types/upload-file.types';

/**
 * First-line upload checks: presence, single file, size, MIME allowlist,
 * extension allowlist, and extension↔MIME consistency.
 */
@Injectable()
export class FileValidationService {
  public constructor(private readonly config: AppConfigService) {}

  public assertPresent(file: UploadedImageFile | undefined): asserts file is UploadedImageFile {
    if (file === undefined || file.buffer.length === 0) {
      throw new DomainException(
        ErrorCode.FileMissing,
        FILE_ERROR_MESSAGES.fileMissing,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public assertSize(file: UploadedImageFile): void {
    const tooLarge =
      file.size > this.config.maxImageSizeBytes ||
      file.buffer.length > this.config.maxImageSizeBytes;

    if (tooLarge) {
      throw new DomainException(
        ErrorCode.FileTooLarge,
        FILE_ERROR_MESSAGES.fileTooLarge,
        HttpStatus.PAYLOAD_TOO_LARGE,
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

  private typeNotAllowed(): DomainException {
    return new DomainException(
      ErrorCode.FileTypeNotAllowed,
      FILE_ERROR_MESSAGES.typeNotAllowed,
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
  }
}
