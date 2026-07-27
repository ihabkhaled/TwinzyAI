import { describe, expect, it } from 'vitest';

import type { PublicFigureProfile, QualitativeMatchingProfile } from '@twinzy/shared';
import {
  MatchingSignalConfidence,
  MatchingSignalVisibility,
  PublicFigureSource,
} from '@twinzy/shared';

import { PublicFigureRetrievalService } from '../application/public-figure-retrieval.service';
import { PublicFigureCatalogRepository } from '../infrastructure/public-figure-catalog.repository';

const profile: QualitativeMatchingProfile = {
  stableVisibleStructure: [
    {
      id: 'overallFace.overallFaceShape',
      value: 'soft oval',
      confidence: MatchingSignalConfidence.High,
      weight: 9,
      visibility: MatchingSignalVisibility.Visible,
      affectedBy: [],
    },
  ],
  mutableStyleSignals: [],
  expressionAndPresentation: [],
  occludedOrUncertainSignals: [],
  contradictionsToAvoid: [],
  accessoryAgnosticSignals: [],
  imageQualityCaps: [],
};

const catalog: readonly PublicFigureProfile[] = [
  {
    entityId: 'Q100',
    canonicalName: 'Regional Figure',
    aliases: [],
    localizedNames: { ar: 'شخصية إقليمية' },
    countryOrRegion: 'Egypt',
    publicCategories: ['actor'],
    stableAppearanceTags: ['soft oval'],
    mutableStyleTags: [],
    presentationTags: [],
    signatureLooks: [],
    sourceReferences: [
      {
        source: PublicFigureSource.Wikidata,
        sourceId: 'Q100',
        url: 'https://www.wikidata.org/wiki/Q100',
      },
    ],
  },
  {
    entityId: 'Q200',
    canonicalName: 'Global Figure',
    aliases: [],
    localizedNames: {},
    countryOrRegion: 'United States',
    publicCategories: ['actor'],
    stableAppearanceTags: ['soft oval'],
    mutableStyleTags: [],
    presentationTags: [],
    signatureLooks: [],
    sourceReferences: [
      {
        source: PublicFigureSource.Curated,
        sourceId: 'Q200',
        url: 'https://www.wikidata.org/wiki/Q200',
      },
    ],
  },
];

const regionalFigure = catalog[0];

describe('PublicFigureRetrievalService', () => {
  it('returns deterministic entity-id candidates with structure and regional coverage lanes', () => {
    const service = new PublicFigureRetrievalService(new PublicFigureCatalogRepository(catalog));

    const results = service.retrieve(profile, 'ar', 10);

    expect(results.map((result) => result.entityId)).toEqual(['Q100', 'Q200']);
    expect(results[0]?.laneIds).toEqual(
      expect.arrayContaining(['structure-first', 'regional-first']),
    );
    expect(results[1]?.laneIds).toContain('structure-first');
  });

  it('deduplicates catalog entities and never returns an unresolved name', () => {
    expect(regionalFigure).toBeDefined();
    if (regionalFigure === undefined) {
      throw new Error('Test fixture is missing the regional figure');
    }
    const service = new PublicFigureRetrievalService(
      new PublicFigureCatalogRepository([...catalog, regionalFigure]),
    );

    const results = service.retrieve(profile, 'en', 10);

    expect(results.map((result) => result.entityId)).toEqual(['Q100', 'Q200']);
    expect(results.every((result) => /^Q[1-9]\d*$/u.test(result.entityId))).toBe(true);
  });

  it('uses locale only as a coverage hint and not as final evidence score', () => {
    const service = new PublicFigureRetrievalService(new PublicFigureCatalogRepository(catalog));

    const arabic = service.retrieve(profile, 'ar', 10);
    const english = service.retrieve(profile, 'en', 10);

    expect(arabic.map((result) => result.retrievalScore)).toEqual(
      english.map((result) => result.retrievalScore),
    );
  });

  it('records every evidence lane and penalizes stable contradictions', () => {
    const stableSignal = profile.stableVisibleStructure[0];
    const baseCatalogProfile = catalog[0];
    if (stableSignal === undefined || baseCatalogProfile === undefined) {
      throw new Error('Test fixtures are incomplete');
    }
    const detailedProfile: QualitativeMatchingProfile = {
      ...profile,
      accessoryAgnosticSignals: [
        {
          ...stableSignal,
          id: 'accessory-1',
        },
      ],
      mutableStyleSignals: [
        {
          ...stableSignal,
          id: 'mutable-1',
          value: 'wavy hair',
        },
      ],
      expressionAndPresentation: [
        {
          ...stableSignal,
          id: 'presentation-1',
          value: 'warm smile',
        },
      ],
      contradictionsToAvoid: [
        {
          ...stableSignal,
          id: 'contradiction-1',
        },
      ],
    };
    const detailedCatalog: readonly PublicFigureProfile[] = [
      {
        ...baseCatalogProfile,
        mutableStyleTags: ['wavy hair'],
        presentationTags: ['warm smile'],
        sourceReferences: [],
      },
    ];
    const service = new PublicFigureRetrievalService(
      new PublicFigureCatalogRepository(detailedCatalog),
    );

    const result = service.retrieve(detailedProfile, 'unknown', 10)[0];

    expect(result?.laneIds).toEqual(
      expect.arrayContaining([
        'structure-first',
        'accessory-agnostic',
        'hair-and-facial-hair',
        'expression-and-presentation',
      ]),
    );
    expect(result?.laneIds).not.toContain('regional-first');
    expect(result?.contradictionCount).toBe(1);
    expect(result?.sourceConfidence).toBe(0);
  });
});
