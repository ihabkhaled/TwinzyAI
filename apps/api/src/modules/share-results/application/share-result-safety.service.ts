import { Injectable } from '@nestjs/common';

import type { FinalGameResult } from '@twinzy/shared';
import { RESULT_DISCLAIMER_BY_LANGUAGE } from '@twinzy/shared';

import { AppConfigService } from '../../../config';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { sharePayloadTooLargeError, shareResultUnsafeError } from '../lib/share-result-errors';
import { collectStringValues, isUnshareableText } from '../lib/share-result-safety.util';
import { SHARE_LOG_CONTEXT } from '../model/share-result.messages';

/**
 * Gatekeeper for an untrusted create request. Even though the result already
 * passed the AI safety filter when it was produced, a share create is a FRESH
 * request anyone can craft — so the disclaimer must equal the server-owned
 * localized copy, every other string leaf is re-scanned for forbidden wording
 * and embedded image bytes, and the whole payload is size-bounded before cache.
 */
@Injectable()
export class ShareResultSafetyService {
  public constructor(
    private readonly appConfig: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SHARE_LOG_CONTEXT);
  }

  /** Rejects a result whose JSON exceeds the configured byte budget. */
  public assertWithinPayloadBudget(result: FinalGameResult): void {
    const byteLength = Buffer.byteLength(JSON.stringify(result), 'utf8');
    if (byteLength > this.appConfig.shareResultMaxPayloadBytes) {
      this.logger.warn(`Rejected oversized share payload (${byteLength} bytes)`);
      throw sharePayloadTooLargeError();
    }
  }

  /** Rejects a result carrying forbidden wording or embedded image bytes anywhere. */
  public assertSafeToShare(result: FinalGameResult): void {
    const hasInvalidDisclaimer =
      result.disclaimer !== RESULT_DISCLAIMER_BY_LANGUAGE[result.languageCode];
    const content = { ...result, disclaimer: '' };
    const hasUnsafeText = collectStringValues(content).some((text) => isUnshareableText(text));
    if (hasInvalidDisclaimer || hasUnsafeText) {
      this.logger.warn('Rejected unsafe share result');
      throw shareResultUnsafeError();
    }
  }
}
