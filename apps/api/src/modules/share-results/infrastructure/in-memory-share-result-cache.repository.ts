import { Injectable, type OnModuleDestroy } from '@nestjs/common';

import { AppLogger } from '../../../core/logger/app-logger.service';
import { isShareExpired } from '../lib/share-result-expiry.util';
import { SHARE_CACHE_SWEEP_INTERVAL_MS } from '../model/share-result.constants';
import { SHARE_LOG_CONTEXT } from '../model/share-result.messages';
import type { ShareResultCachePort } from '../model/share-result.port';
import type { StoredShareRecord } from '../model/share-result.types';

/**
 * Bounded in-memory TTL cache for share records — a pure store with no business
 * policy (max-active and payload caps are enforced by the service above it).
 *
 * Memory is bounded three ways: reads never return an expired record and prune
 * it on the spot (lazy expiry); a periodic sweeper reclaims records that expire
 * and are never read again; and the process interval is `unref`-ed + cleared on
 * shutdown so it can never leak or keep the process alive. This is a
 * single-instance driver — records live only in this process's heap and are
 * gone on restart/redeploy (documented; Redis/Valkey is the multi-replica path).
 */
@Injectable()
export class InMemoryShareResultCacheRepository implements ShareResultCachePort, OnModuleDestroy {
  private readonly store = new Map<string, StoredShareRecord>();

  private readonly sweeper: ReturnType<typeof setInterval>;

  public constructor(private readonly logger: AppLogger) {
    this.logger.setContext(SHARE_LOG_CONTEXT);
    this.sweeper = setInterval(() => {
      this.sweepExpired();
    }, SHARE_CACHE_SWEEP_INTERVAL_MS);
    this.sweeper.unref();
  }

  public set(record: StoredShareRecord): Promise<void> {
    this.store.set(record.shareId, record);
    return Promise.resolve();
  }

  public get(shareId: string): Promise<StoredShareRecord | undefined> {
    const record = this.store.get(shareId);
    if (record === undefined) {
      return Promise.resolve(record);
    }
    if (isShareExpired(record.expiresAtMs, Date.now())) {
      // Lazy expiry: drop it now; the follow-up lookup is undefined by construction.
      this.store.delete(shareId);
      return Promise.resolve(this.store.get(shareId));
    }
    return Promise.resolve(record);
  }

  public delete(shareId: string): Promise<void> {
    this.store.delete(shareId);
    return Promise.resolve();
  }

  public size(): Promise<number> {
    return Promise.resolve(this.countLiveAndPrune());
  }

  public onModuleDestroy(): void {
    clearInterval(this.sweeper);
    this.store.clear();
  }

  /** Removes every expired record and returns how many live records remain. */
  private countLiveAndPrune(): number {
    const now = Date.now();
    let live = 0;
    for (const [shareId, record] of this.store) {
      if (isShareExpired(record.expiresAtMs, now)) {
        this.store.delete(shareId);
      } else {
        live += 1;
      }
    }
    return live;
  }

  private sweepExpired(): void {
    const before = this.store.size;
    const live = this.countLiveAndPrune();
    const reclaimed = before - live;
    if (reclaimed > 0) {
      this.logger.debug(`Swept ${reclaimed} expired share record(s)`);
    }
  }
}
