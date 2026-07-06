import { Module } from '@nestjs/common';

import { ClamAvAdapter } from './adapters/clamav.adapter';
import { FileSecurityService } from './application/file-security.service';
import { FileValidationService } from './application/file-validation.service';
import { ImageDecodeValidationService } from './application/image-decode-validation.service';
import { MagicByteValidationService } from './application/magic-byte-validation.service';
import { TemporaryFileCleanupService } from './application/temporary-file-cleanup.service';
import { VirusScanService } from './application/virus-scan.service';

@Module({
  providers: [
    FileSecurityService,
    FileValidationService,
    MagicByteValidationService,
    ImageDecodeValidationService,
    VirusScanService,
    TemporaryFileCleanupService,
    ClamAvAdapter,
  ],
  exports: [FileSecurityService, TemporaryFileCleanupService],
})
export class FileSecurityModule {}
