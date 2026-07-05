import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { AppConfigService } from '../../../config/app-config.service';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { ClamAvAdapter } from '../adapters/clamav.adapter';
import { FILE_ERROR_MESSAGES } from '../constants/file-security.constants';

const LOG_CONTEXT = 'VirusScan';

/**
 * Virus-scan policy. Scanning is optional (ENABLE_CLAMAV); when it is
 * enabled and the scanner is unreachable or errors, the upload is rejected
 * — fail CLOSED. Development disables scanning via env, never via code.
 */
@Injectable()
export class VirusScanService {
  public constructor(
    private readonly config: AppConfigService,
    private readonly clamAv: ClamAvAdapter,
    private readonly logger: LoggerService,
  ) {}

  public async assertClean(buffer: Buffer): Promise<void> {
    if (!this.config.enableClamAv) {
      return;
    }

    let clean: boolean;
    try {
      const result = await this.clamAv.scanBuffer(buffer);
      clean = result.clean;
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'unknown scanner error';
      this.logger.error(LOG_CONTEXT, `Scanner unavailable, failing closed: ${reason}`);
      throw new DomainException(
        ErrorCode.VirusScanFailed,
        FILE_ERROR_MESSAGES.scanFailed,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!clean) {
      this.logger.warn(LOG_CONTEXT, 'Upload rejected by virus scanner');
      throw new DomainException(
        ErrorCode.VirusScanFailed,
        FILE_ERROR_MESSAGES.fileInvalid,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
