import { describe, expect, it, vi } from 'vitest';

import type { PublicFigureImage } from '@twinzy/shared';

import type { WikidataAdapter } from '../adapters/wikidata.adapter';
import type { WikimediaCommonsAdapter } from '../adapters/wikimedia-commons.adapter';
import type { WikipediaAdapter } from '../adapters/wikipedia.adapter';
import { PublicFigureEnrichmentGatewayService } from '../application/public-figure-enrichment-gateway.service';

const image: PublicFigureImage = {
  thumbnailUrl: 'https://upload.wikimedia.org/example.jpg',
  fullUrl: 'https://upload.wikimedia.org/example-full.jpg',
  author: 'Example Author',
  licenseName: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
  alt: 'Example Figure',
};

const buildGateway = (options?: {
  wikidata?: unknown;
  wikipedia?: unknown;
  image?: unknown;
}): {
  service: PublicFigureEnrichmentGatewayService;
  wikipedia: WikipediaAdapter;
  commons: WikimediaCommonsAdapter;
} => {
  const wikidata = {
    lookup: vi.fn().mockResolvedValue(
      options?.wikidata ?? {
        canonicalName: 'Example Figure',
        localizedName: 'مثال',
        description: 'Public actor',
        wikipediaTitle: 'Example Figure',
        imageFileName: 'Example.jpg',
      },
    ),
  } as unknown as WikidataAdapter;
  const wikipedia = {
    summary: vi.fn().mockResolvedValue(
      options?.wikipedia ?? {
        biographySummary: 'A short verified biography.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Example_Figure',
      },
    ),
  } as unknown as WikipediaAdapter;
  const commons = {
    image: vi.fn().mockResolvedValue(options?.image ?? image),
  } as unknown as WikimediaCommonsAdapter;
  return {
    service: new PublicFigureEnrichmentGatewayService(wikidata, wikipedia, commons),
    wikipedia,
    commons,
  };
};

describe('PublicFigureEnrichmentGatewayService', () => {
  it('combines verified metadata, biography, and licensed image sources', async () => {
    const { service } = buildGateway();

    await expect(service.enrich('Q1', 'ar', 'Fallback')).resolves.toEqual({
      canonicalName: 'Example Figure',
      localizedName: 'مثال',
      description: 'Public actor',
      biographySummary: 'A short verified biography.',
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Example_Figure',
      image,
    });
  });

  it('returns no enrichment when the entity metadata source fails', async () => {
    const { service } = buildGateway();
    const failing = service as unknown as {
      wikidata: { lookup: ReturnType<typeof vi.fn> };
    };
    failing.wikidata.lookup.mockRejectedValueOnce(new Error('offline'));

    await expect(service.enrich('Q1', 'en', 'Fallback')).resolves.toBeUndefined();
  });

  it('omits unavailable optional sources without failing the match', async () => {
    const { service, wikipedia, commons } = buildGateway({
      wikidata: {
        canonicalName: 'Example Figure',
      },
    });

    await expect(service.enrich('Q1', 'en', 'Fallback')).resolves.toEqual({
      canonicalName: 'Example Figure',
      localizedName: undefined,
      description: undefined,
      biographySummary: undefined,
      wikipediaUrl: undefined,
      image: undefined,
    });
    expect(wikipedia.summary).not.toHaveBeenCalled();
    expect(commons.image).not.toHaveBeenCalled();
  });

  it('contains individual biography and image failures as optional fallbacks', async () => {
    const { service, wikipedia, commons } = buildGateway();
    vi.mocked(wikipedia.summary).mockRejectedValueOnce(new Error('offline'));
    vi.mocked(commons.image).mockRejectedValueOnce(new Error('offline'));

    const result = await service.enrich('Q1', 'en', 'Fallback');

    expect(result?.biographySummary).toBeUndefined();
    expect(result?.image).toBeUndefined();
  });
});
