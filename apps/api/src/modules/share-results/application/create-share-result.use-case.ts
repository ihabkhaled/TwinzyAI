import { Injectable } from '@nestjs/common';

import type { CreateShareResultRequest, CreateShareResultResponse } from '@twinzy/shared';

import { AppConfigService } from '../../../config';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { generateShareId } from '../lib/share-id.util';
import { computeShareExpiry } from '../lib/share-result-expiry.util';
import { buildShareUrl } from '../lib/share-result-url.util';
import { SHARE_LOG_CONTEXT } from '../model/share-result.messages';
import type { StoredShareRecord } from '../model/share-result.types';

import { ShareResultCacheService } from './share-result-cache.service';
import { ShareResultSafetyService } from './share-result-safety.service';

/**
 * Create flow: validate the payload is safe and bounded, mint an unguessable
 * id, compute the expiry window from the server clock, cache ONLY the safe
 * result JSON, and return the public-link metadata. No image is ever involved —
 * the request has no image slot — and the payload is never logged.
 */
@Injectable()
export class CreateShareResultUseCase {
  public constructor(
    private readonly safety: ShareResultSafetyService,
    private readonly cache: ShareResultCacheService,
    private readonly appConfig: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SHARE_LOG_CONTEXT);
  }

  public async create(request: CreateShareResultRequest): Promise<CreateShareResultResponse> {
    const { result } = request;
    this.safety.assertWithinPayloadBudget(result);
    this.safety.assertSafeToShare(result);

    const ttlSeconds = this.appConfig.shareResultTtlSeconds;
    const { createdAtMs, expiresAtMs } = computeShareExpiry(Date.now(), ttlSeconds);
    const shareId = generateShareId();

    const record: StoredShareRecord = {
      shareId,
      languageCode: result.languageCode,
      result,
      createdAtMs,
      expiresAtMs,
    };
    await this.cache.store(record);

    this.logger.info(`Created share ${shareId} (ttl ${ttlSeconds}s)`);
    return {
      shareId,
      shareUrl: buildShareUrl(this.appConfig.shareResultPublicBaseUrl, shareId),
      createdAt: new Date(createdAtMs).toISOString(),
      expiresAt: new Date(expiresAtMs).toISOString(),
      ttlSeconds,
    };
  }
}
