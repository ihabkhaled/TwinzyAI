import { Inject, Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config';
import { shareCapacityError } from '../lib/share-result-errors';
import { SHARE_RESULT_CACHE, type ShareResultCachePort } from '../model/share-result.port';
import type { StoredShareRecord } from '../model/share-result.types';

/**
 * Application-level cache coordinator. Owns the ONE business rule the pure cache
 * port must not: the max-active-items cap. The port prunes expired records when
 * it reports its size, so capacity is measured against live records only; once
 * full, new creates are rejected (never evicting someone else's live share).
 */
@Injectable()
export class ShareResultCacheService {
  public constructor(
    @Inject(SHARE_RESULT_CACHE) private readonly cache: ShareResultCachePort,
    private readonly appConfig: AppConfigService,
  ) {}

  public async store(record: StoredShareRecord): Promise<void> {
    const activeCount = await this.cache.size();
    if (activeCount >= this.appConfig.shareResultMaxActiveItems) {
      throw shareCapacityError();
    }
    await this.cache.set(record);
  }

  public find(shareId: string): Promise<StoredShareRecord | undefined> {
    return this.cache.get(shareId);
  }

  public remove(shareId: string): Promise<void> {
    return this.cache.delete(shareId);
  }
}
