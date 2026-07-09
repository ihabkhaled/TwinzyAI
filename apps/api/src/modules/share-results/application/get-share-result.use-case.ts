import { Injectable } from '@nestjs/common';

import type { ShareResultResponse } from '@twinzy/shared';

import { shareNotFoundError } from '../lib/share-result-errors';
import { shareRemainingSeconds } from '../lib/share-result-expiry.util';

import { ShareResultCacheService } from './share-result-cache.service';

/**
 * Read flow: fetch the live record (the cache never returns an expired one) and
 * shape it into the public response. A missing OR expired id yields the SAME
 * not-found error so a direct visit can never tell whether an id once existed.
 * `remainingSeconds` is computed from the server clock so the client countdown
 * is anchored to the authoritative expiry, not a client-side timestamp.
 */
@Injectable()
export class GetShareResultUseCase {
  public constructor(private readonly cache: ShareResultCacheService) {}

  public async get(shareId: string): Promise<ShareResultResponse> {
    const record = await this.cache.find(shareId);
    if (record === undefined) {
      throw shareNotFoundError();
    }
    return {
      shareId: record.shareId,
      languageCode: record.languageCode,
      result: record.result,
      createdAt: new Date(record.createdAtMs).toISOString(),
      expiresAt: new Date(record.expiresAtMs).toISOString(),
      remainingSeconds: shareRemainingSeconds(record.expiresAtMs, Date.now()),
    };
  }
}
