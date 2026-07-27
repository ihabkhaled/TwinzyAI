import type { PublicFigureEnrichment } from '@twinzy/shared';

import { MILLISECONDS_PER_SECOND } from '../model/public-figure.constants';
import type {
  PublicFigureCacheEntry,
  PublicFigureMetadataCache,
} from '../model/public-figure.types';

export class PublicFigureMetadataCacheRepository implements PublicFigureMetadataCache {
  private readonly entries = new Map<string, PublicFigureCacheEntry>();

  public constructor(private readonly maxItems: number) {}

  public get(entityId: string, languageCode: string): Promise<PublicFigureEnrichment | undefined> {
    const key = this.key(entityId, languageCode);
    const entry = this.entries.get(key);
    if (entry === undefined) {
      return Promise.resolve(undefined);
    }
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return Promise.resolve(undefined);
    }
    return Promise.resolve(entry.value);
  }

  public set(
    entityId: string,
    languageCode: string,
    value: PublicFigureEnrichment,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.key(entityId, languageCode);
    if (!this.entries.has(key) && this.entries.size >= this.maxItems) {
      const oldestKey = this.entries.keys().next().value;
      if (typeof oldestKey === 'string') {
        this.entries.delete(oldestKey);
      }
    }
    this.entries.set(key, {
      expiresAt: Date.now() + ttlSeconds * MILLISECONDS_PER_SECOND,
      value,
    });
    return Promise.resolve();
  }

  private key(entityId: string, languageCode: string): string {
    return `${entityId}:${languageCode}`;
  }
}
