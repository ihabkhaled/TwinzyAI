import { describe, expect, it, vi } from 'vitest';

import type { PublicFigureEnrichment } from '@twinzy/shared';

import { PublicFigureMetadataCacheRepository } from '../infrastructure/public-figure-metadata-cache.repository';

const enrichment = (entityId: string): PublicFigureEnrichment => ({
  entityId,
  canonicalName: `Figure ${entityId}`,
  occupations: ['actor'],
  googleSearchUrl: `https://www.google.com/search?q=${entityId}`,
});

describe('PublicFigureMetadataCacheRepository', () => {
  it('expires entries by TTL without retaining user data', async () => {
    vi.useFakeTimers();
    const cache = new PublicFigureMetadataCacheRepository(2);
    await cache.set('Q100', 'en', enrichment('Q100'), 60);

    expect(await cache.get('Q100', 'en')).toEqual(enrichment('Q100'));
    await vi.advanceTimersByTimeAsync(60_001);
    expect(await cache.get('Q100', 'en')).toBeUndefined();
    vi.useRealTimers();
  });

  it('evicts the oldest entry when the bounded capacity is reached', async () => {
    const cache = new PublicFigureMetadataCacheRepository(2);
    await cache.set('Q100', 'en', enrichment('Q100'), 60);
    await cache.set('Q200', 'en', enrichment('Q200'), 60);
    await cache.set('Q300', 'en', enrichment('Q300'), 60);

    expect(await cache.get('Q100', 'en')).toBeUndefined();
    expect(await cache.get('Q200', 'en')).toEqual(enrichment('Q200'));
    expect(await cache.get('Q300', 'en')).toEqual(enrichment('Q300'));
  });
});
