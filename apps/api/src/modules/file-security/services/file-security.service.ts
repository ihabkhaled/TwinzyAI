import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { FILE_ERROR_MESSAGES } from '../constants/file-security.constants';
import type { UploadedImageFile } from '../types/upload-file.types';

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
    private readonly logger: LoggerService,
  ) {}

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

    this.logger.log(LOG_CONTEXT, 'Upload passed the full validation chain');
    return file;
  }

  private assertConsent(consent: boolean): void {
    if (!consent) {
      throw new DomainException(
        ErrorCode.ConsentRequired,
        FILE_ERROR_MESSAGES.consentRequired,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
