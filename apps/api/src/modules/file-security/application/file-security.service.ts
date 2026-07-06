import { Injectable } from '@nestjs/common';

import { ERROR_MESSAGE_KEY_BY_CODE, ErrorCode, ValidationError } from '../../../core/errors';
import { AppLogger } from '../../../core/logger';
import { FILE_ERROR_MESSAGES } from '../model/file-security.constants';
import type { UploadedImageFile } from '../model/upload-file.types';

import { FileValidationService } from './file-validation.service';
import { ImageDecodeValidationService } from './image-decode-validation.service';
import { MagicByteValidationService } from './magic-byte-validation.service';
import { VirusScanService } from './virus-scan.service';

const LOG_CONTEXT = 'FileSecurity';

/**
 * Orchestrates the full upload validation chain in its documented order
 * (rules/15): consent → presence → size → type allowlists + consistency →
 * magic bytes → structural decode → optional virus scan.
 * The backend is the source of truth; frontend checks are UX only.
 */
@Injectable()
export class FileSecurityService {
  public constructor(
    private readonly fileValidation: FileValidationService,
    private readonly magicBytes: MagicByteValidationService,
    private readonly imageDecode: ImageDecodeValidationService,
    private readonly virusScan: VirusScanService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async assertSafeImage(
    file: UploadedImageFile | undefined,
    consent: boolean,
  ): Promise<UploadedImageFile> {
    this.assertConsent(consent);
    this.fileValidation.assertPresent(file);
    this.fileValidation.assertSize(file);
    this.fileValidation.assertAllowedType(file);
    this.magicBytes.assertMagicBytesMatch(file.buffer, file.mimetype);
    this.imageDecode.assertDecodable(file.buffer, file.mimetype);
    await this.virusScan.assertClean(file.buffer);

    this.logger.info('Upload passed the full validation chain');
    return file;
  }

  private assertConsent(consent: boolean): void {
    if (!consent) {
      throw new ValidationError(
        FILE_ERROR_MESSAGES.consentRequired,
        ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.ConsentRequired],
        ErrorCode.ConsentRequired,
      );
    }
  }
}
