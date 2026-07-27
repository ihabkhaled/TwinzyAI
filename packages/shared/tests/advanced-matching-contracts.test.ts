import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import * as shared from '../src';

const matchingSignal = {
  id: 'overallFace.overallFaceShape',
  value: 'soft oval impression',
  confidence: 'high',
  weight: 8,
  visibility: 'visible',
  affectedBy: [],
};

const matchingProfile = {
  stableVisibleStructure: [matchingSignal],
  mutableStyleSignals: [],
  expressionAndPresentation: [],
  occludedOrUncertainSignals: [],
  contradictionsToAvoid: [],
  accessoryAgnosticSignals: [matchingSignal],
  imageQualityCaps: [],
};

const schemaExport = (name: string): z.ZodType => {
  const value: unknown = shared[name as keyof typeof shared];
  expect(value).toBeInstanceOf(z.ZodType);
  if (!(value instanceof z.ZodType)) {
    throw new TypeError(`Missing schema export: ${name}`);
  }
  return value;
};

describe('advanced matching shared contracts', () => {
  it('requires bounded qualitative matching evidence on extraction responses', () => {
    const extractionSchema = schemaExport('TraitExtractionResponseSchema');
    const currentFixture = {
      promptVersion: shared.GAME_PROMPT_VERSION,
      languageCode: 'en',
      traits: {},
    };

    const matchingSchema = schemaExport('QualitativeMatchingProfileSchema');
    expect(matchingSchema.safeParse(matchingProfile).success).toBe(true);
    expect(
      matchingSchema.safeParse({
        ...matchingProfile,
        stableVisibleStructure: Array.from({ length: 21 }, () => matchingSignal),
      }).success,
    ).toBe(false);
    expect(extractionSchema.safeParse(currentFixture).success).toBe(false);
  });

  it('rejects invalid counterfactual signals and unbounded entity identifiers', () => {
    const counterfactualSchema = schemaExport('MatchingCounterfactualProfilesSchema');
    const publicFigureSchema = schemaExport('PublicFigureProfileSchema');

    expect(
      counterfactualSchema.safeParse({
        withoutEyewear: [matchingSignal],
        withoutFacialHair: [],
        withoutMutableStyling: [matchingSignal],
      }).success,
    ).toBe(true);
    expect(
      publicFigureSchema.safeParse({
        entityId: 'Q8000',
        canonicalName: 'Example Person',
        aliases: [],
        localizedNames: { ar: 'شخصية تجريبية' },
        countryOrRegion: 'Egypt',
        publicCategories: ['actor'],
        stableAppearanceTags: ['soft oval impression'],
        mutableStyleTags: [],
        presentationTags: ['warm smile'],
        signatureLooks: [],
        sourceReferences: [
          {
            source: 'wikidata',
            sourceId: 'Q8000',
            url: 'https://www.wikidata.org/wiki/Q8000',
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      publicFigureSchema.safeParse({
        entityId: `Q${'1'.repeat(80)}`,
        canonicalName: 'Invalid',
      }).success,
    ).toBe(false);
  });

  it('bounds participant reports and validates backend consensus scores', () => {
    const rankingSchema = schemaExport('ModelCandidateRankingSchema');
    const judgeSchema = schemaExport('ModelJudgeReportSchema');
    const critiqueSchema = schemaExport('ModelCrossCritiqueSchema');
    const consensusSchema = schemaExport('ConsensusCandidateSchema');

    expect(
      rankingSchema.safeParse({
        participantId: 'gemini:configured-model',
        entityId: 'Q8000',
        supportedSignalIds: ['overallFace.overallFaceShape'],
        contradictedSignalIds: [],
        stableEvidenceScore: 82,
        mutableStyleScore: 40,
        presentationScore: 70,
        evidenceCoverage: 75,
      }).success,
    ).toBe(true);
    expect(
      judgeSchema.safeParse({
        participantId: 'gpt:configured-model',
        entityId: 'Q8000',
        stableEvidenceScore: 80,
        mutableStyleScore: 40,
        expressionScore: 70,
        contradictionSeverity: 5,
        uncertaintyPenalty: 3,
        confidence: 76,
        supportedSignalIds: ['overallFace.overallFaceShape'],
        contradictedSignalIds: [],
        unsupportedClaims: [],
        shouldKeep: true,
      }).success,
    ).toBe(true);
    expect(
      critiqueSchema.safeParse({
        reviewerParticipantId: 'deepseek:configured-model',
        critiques: [],
        missingCoverage: [],
        requiresSecondRetrievalPass: false,
        suggestedSearchTags: [],
      }).success,
    ).toBe(true);
    expect(
      consensusSchema.safeParse({
        entityId: 'Q8000',
        finalScore: 81,
        confidence: 76,
        supportedSignalIds: ['overallFace.overallFaceShape'],
        contradictedSignalIds: [],
      }).success,
    ).toBe(true);
    expect(
      consensusSchema.safeParse({
        entityId: 'Q8000',
        finalScore: 101,
        confidence: 76,
        supportedSignalIds: [],
        contradictedSignalIds: [],
      }).success,
    ).toBe(false);
  });

  it('accepts only attributed HTTPS public-figure enrichment', () => {
    const enrichmentSchema = schemaExport('PublicFigureEnrichmentSchema');
    const valid = {
      entityId: 'Q8000',
      canonicalName: 'Example Person',
      localizedName: 'شخصية تجريبية',
      description: 'Actor',
      biographySummary: 'A verified short biography.',
      occupations: ['actor'],
      countryOrRegion: 'Egypt',
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Example_Person',
      googleSearchUrl: 'https://www.google.com/search?q=Example%20Person',
      image: {
        thumbnailUrl: 'https://upload.wikimedia.org/example-thumb.jpg',
        fullUrl: 'https://upload.wikimedia.org/example.jpg',
        alt: 'Example Person',
        author: 'Example Author',
        credit: 'Wikimedia Commons',
        licenseName: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
      },
    };

    expect(enrichmentSchema.safeParse(valid).success).toBe(true);
    expect(
      enrichmentSchema.safeParse({
        ...valid,
        image: { ...valid.image, thumbnailUrl: 'http://insecure.example/image.jpg' },
      }).success,
    ).toBe(false);
  });

  it('limits the finalizer contract to localized prose for existing entities', () => {
    const finalizerSchema = schemaExport('ConsensusFinalizerResponseSchema');
    const valid = {
      languageCode: 'en',
      explanations: [
        {
          entityId: 'Q8000',
          finalReason: 'Evidence-only localized explanation.',
          mismatchWarnings: ['One stable signal remains uncertain.'],
          judgeNotes: 'The backend score remains authoritative.',
        },
      ],
    };

    expect(finalizerSchema.safeParse(valid).success).toBe(true);
    expect(
      finalizerSchema.safeParse({
        ...valid,
        explanations: [
          {
            ...valid.explanations[0],
            finalScore: 100,
          },
        ],
      }).success,
    ).toBe(false);
  });
});
