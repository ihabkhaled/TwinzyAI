import type { AdvancedMatchingBenchmarkObservation } from './model/advanced-matching-benchmark.types';

/**
 * Controlled text-only smoke fixture. Entity ids are synthetic benchmark
 * labels, not production catalog rules, and no image or personal data exists
 * in this file.
 */
export const ADVANCED_MATCHING_SYNTHETIC_OBSERVATIONS: readonly AdvancedMatchingBenchmarkObservation[] =
  [
    {
      expectedEntityIds: ['Q900000001'],
      retrievedEntityIds: ['Q900000001', 'Q900000002'],
      expectedRegionalEntityIds: ['Q900000001'],
      regionalEntityIds: ['Q900000001'],
      expectedStructureFirstEntityIds: ['Q900000001'],
      structureFirstEntityIds: ['Q900000001'],
      supportedStableEvidenceClaims: 4,
      stableEvidenceClaims: 5,
      unsupportedTraitClaims: 1,
      totalTraitClaims: 10,
      majorContradictions: 0,
      evaluatedCandidates: 2,
      participantTopEntityIds: ['Q900000001', 'Q900000001', 'Q900000002'],
      correctlyResolvedEntities: 2,
      entityResolutionAttempts: 2,
      licensedImages: 1,
      enrichedEntities: 1,
      wrongLanguageResponses: 0,
      localizedResponses: 3,
      latencyMs: 1200,
      costUsd: 0.01,
    },
  ];
