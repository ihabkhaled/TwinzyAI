import { describe, expect, it } from 'vitest';

import { ADVANCED_MATCHING_SYNTHETIC_OBSERVATIONS } from '../advanced-matching-benchmark-fixtures';
import { calculateAdvancedMatchingBenchmarkMetrics } from '../lib/advanced-matching-benchmark-metrics.util';
import type { AdvancedMatchingBenchmarkObservation } from '../model/advanced-matching-benchmark.types';

const syntheticObservation = ADVANCED_MATCHING_SYNTHETIC_OBSERVATIONS[0];
if (syntheticObservation === undefined) {
  throw new Error('Synthetic benchmark fixture is missing');
}

const observation = (
  overrides: Partial<AdvancedMatchingBenchmarkObservation> = {},
): AdvancedMatchingBenchmarkObservation => ({
  ...syntheticObservation,
  ...overrides,
});

describe('advanced text-only matching benchmark metrics', () => {
  it('calculates every required recall, safety, quality, latency, and cost metric', () => {
    const metrics = calculateAdvancedMatchingBenchmarkMetrics([
      observation(),
      observation({
        expectedEntityIds: ['Q5', 'Q10', 'Q25'],
        retrievedEntityIds: Array.from({ length: 25 }, (_unused, index) => `Q${index + 1}`),
        expectedRegionalEntityIds: ['Q5', 'Q404'],
        regionalEntityIds: ['Q5'],
        expectedStructureFirstEntityIds: ['Q10', 'Q404'],
        structureFirstEntityIds: ['Q10'],
        participantTopEntityIds: ['Q5', 'Q5', 'Q5'],
        supportedStableEvidenceClaims: 6,
        stableEvidenceClaims: 10,
        unsupportedTraitClaims: 2,
        totalTraitClaims: 10,
        majorContradictions: 1,
        evaluatedCandidates: 2,
        correctlyResolvedEntities: 1,
        entityResolutionAttempts: 2,
        licensedImages: 1,
        enrichedEntities: 2,
        wrongLanguageResponses: 1,
        localizedResponses: 2,
        latencyMs: 2400,
        costUsd: 0.03,
      }),
    ]);

    expect(metrics).toMatchObject({
      expectedCandidateRecallAt25: 1,
      expectedCandidateTop10HitRate: 3 / 4,
      expectedCandidateTop5HitRate: 0.5,
      regionalRecall: 2 / 3,
      structureFirstRecall: 2 / 3,
      stableEvidencePrecision: 10 / 15,
      unsupportedTraitClaimRate: 3 / 20,
      majorContradictionRate: 1 / 4,
      crossModelAgreement: (2 / 3 + 1) / 2,
      entityResolutionAccuracy: 3 / 4,
      licensedImageCoverage: 2 / 3,
      wrongLanguageRate: 1 / 5,
      latencyP50Ms: 1200,
      latencyP95Ms: 2400,
      costPerAnalysisUsd: 0.02,
    });
  });

  it('returns safe zero metrics for an empty private benchmark set', () => {
    expect(calculateAdvancedMatchingBenchmarkMetrics([])).toEqual({
      expectedCandidateRecallAt25: 0,
      expectedCandidateTop10HitRate: 0,
      expectedCandidateTop5HitRate: 0,
      regionalRecall: 0,
      structureFirstRecall: 0,
      stableEvidencePrecision: 0,
      unsupportedTraitClaimRate: 0,
      majorContradictionRate: 0,
      crossModelAgreement: 0,
      entityResolutionAccuracy: 0,
      licensedImageCoverage: 0,
      wrongLanguageRate: 0,
      latencyP50Ms: 0,
      latencyP95Ms: 0,
      costPerAnalysisUsd: 0,
    });
  });

  it('treats an observation with no participant outputs as zero agreement', () => {
    const metrics = calculateAdvancedMatchingBenchmarkMetrics([
      observation({ participantTopEntityIds: [] }),
    ]);

    expect(metrics.crossModelAgreement).toBe(0);
  });
});
