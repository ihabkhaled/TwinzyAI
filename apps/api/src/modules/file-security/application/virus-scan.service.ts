import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import { AppLogger } from '../../../core/logger';
import { ClamAvAdapter } from '../adapters/clamav.adapter';
import { FILE_ERROR_MESSAGES } from '../model/file-security.constants';
import { InfectedFileError, VirusScanUnavailableError } from '../model/file-security.errors';

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
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

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
      this.logger.error(`Scanner unavailable, failing closed: ${reason}`);
      throw new VirusScanUnavailableError(FILE_ERROR_MESSAGES.scanFailed);
    }

    if (!clean) {
      this.logger.warn('Upload rejected by virus scanner');
      throw new InfectedFileError(FILE_ERROR_MESSAGES.fileInvalid);
    }
  }
}
