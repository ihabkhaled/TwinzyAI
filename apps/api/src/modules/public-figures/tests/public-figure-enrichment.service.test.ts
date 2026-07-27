import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PublicFigureEnrichment } from '@twinzy/shared';

import { buildConfigStub } from '../../../tests/fixtures/stubs';
import { GetPublicFigureDetailsUseCase } from '../application/get-public-figure-details.use-case';
import { PublicFigureEnrichmentService } from '../application/public-figure-enrichment.service';
import type { PublicFigureEnrichmentGatewayService } from '../application/public-figure-enrichment-gateway.service';
import { PublicFigureEntityResolutionService } from '../application/public-figure-entity-resolution.service';
import { PublicFigureCatalogRepository } from '../infrastructure/public-figure-catalog.repository';
import type { PublicFigureMetadataCacheRepository } from '../infrastructure/public-figure-metadata-cache.repository';

const advancedConfig = (
  enrichmentEnabled: boolean,
): ReturnType<typeof buildConfigStub>['advancedMatching'] => ({
  ...buildConfigStub().advancedMatching,
  enrichmentEnabled,
});

const cached: PublicFigureEnrichment = {
  entityId: 'Q170515',
  canonicalName: 'Cached Figure',
  occupations: ['actor'],
  googleSearchUrl: 'https://www.google.com/search?q=Cached+Figure',
};

const buildService = (
  enabled = true,
): {
  service: PublicFigureEnrichmentService;
  cache: PublicFigureMetadataCacheRepository;
  gateway: PublicFigureEnrichmentGatewayService;
  catalog: PublicFigureCatalogRepository;
} => {
  const catalog = new PublicFigureCatalogRepository();
  const cache = {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(undefined),
  } as unknown as PublicFigureMetadataCacheRepository;
  const gateway = {
    enrich: vi.fn().mockResolvedValue(undefined),
  } as unknown as PublicFigureEnrichmentGatewayService;
  const service = new PublicFigureEnrichmentService(
    catalog,
    cache,
    buildConfigStub({ advancedMatching: advancedConfig(enabled) }),
    gateway,
  );
  return { service, cache, gateway, catalog };
};

describe('PublicFigureEnrichmentService', () => {
  it('does not access sources while enrichment is disabled', async () => {
    const { service, cache } = buildService(false);

    await expect(service.enrich('Q170515', 'en')).resolves.toBeUndefined();
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('returns a bounded cached entry before remote lookups', async () => {
    const { service, cache, gateway } = buildService();
    vi.mocked(cache.get).mockResolvedValueOnce(cached);

    await expect(service.enrich('Q170515', 'en')).resolves.toBe(cached);
    expect(gateway.enrich).not.toHaveBeenCalled();
  });

  it('returns no data for an entity outside the verified catalog', async () => {
    const { service, gateway } = buildService();

    await expect(service.enrich('Q999999999', 'en')).resolves.toBeUndefined();
    expect(gateway.enrich).not.toHaveBeenCalled();
  });

  it('builds, validates, and caches remote metadata with licensed media', async () => {
    const { service, cache, gateway } = buildService();
    vi.mocked(gateway.enrich).mockResolvedValueOnce({
      canonicalName: 'Remote Name',
      localizedName: 'اسم محلي',
      description: 'Actor',
      biographySummary: 'Verified summary.',
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Omar_Sharif',
      image: {
        thumbnailUrl: 'https://upload.wikimedia.org/example.jpg',
        fullUrl: 'https://upload.wikimedia.org/example-full.jpg',
        author: 'Author',
        licenseName: 'CC BY 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
        alt: 'Remote Name',
      },
    });

    const result = await service.enrich('Q170515', 'ar');

    expect(result).toMatchObject({
      entityId: 'Q170515',
      canonicalName: 'Remote Name',
      localizedName: 'اسم محلي',
      biographySummary: 'Verified summary.',
    });
    expect(cache.set).toHaveBeenCalledWith(
      'Q170515',
      'ar',
      result,
      advancedConfig(true).cacheTtlSeconds,
    );
  });

  it('falls back to catalog metadata when optional remote sources are unavailable', async () => {
    const { service } = buildService();

    const result = await service.enrich('Q170515', 'en');

    expect(result?.canonicalName).toBe('Omar Sharif');
    expect(result?.googleSearchUrl).toContain('google.com/search');
  });
});

describe('public figure lookup application services', () => {
  it('resolves verified entity ids, aliases, and normalized canonical names', () => {
    const resolver = new PublicFigureEntityResolutionService(new PublicFigureCatalogRepository());

    expect(resolver.resolve(' q170515 ')?.canonicalName).toBe('Omar Sharif');
    expect(resolver.resolve('OMAR SHARIF')?.entityId).toBe('Q170515');
    expect(resolver.resolve('not in catalog')).toBeUndefined();
  });

  it('returns enriched details and maps missing records to a not-found error', async () => {
    const enrich = vi.fn().mockResolvedValueOnce(cached).mockResolvedValueOnce(undefined);
    const useCase = new GetPublicFigureDetailsUseCase({
      enrich,
    } as unknown as PublicFigureEnrichmentService);

    await expect(useCase.execute('Q170515', 'en')).resolves.toBe(cached);
    await expect(useCase.execute('Q404', 'en')).rejects.toBeInstanceOf(NotFoundException);
  });
});
