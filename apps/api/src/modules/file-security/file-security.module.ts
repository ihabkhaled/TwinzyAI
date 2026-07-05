import { Module } from '@nestjs/common';

import { ClamAvAdapter } from './adapters/clamav.adapter';
import { FileSecurityService } from './services/file-security.service';
import { FileValidationService } from './services/file-validation.service';
import { ImageDecodeValidationService } from './services/image-decode-validation.service';
import { MagicByteValidationService } from './services/magic-byte-validation.service';
import { TemporaryFileCleanupService } from './services/temporary-file-cleanup.service';
import { VirusScanService } from './services/virus-scan.service';

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
