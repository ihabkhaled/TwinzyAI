import {
  BENCHMARK_P50_RANK,
  BENCHMARK_P95_RANK,
  BENCHMARK_RECALL_LIMIT,
  BENCHMARK_TOP_FIVE_LIMIT,
  BENCHMARK_TOP_TEN_LIMIT,
} from '../model/advanced-matching-benchmark.constants';
import type {
  AdvancedMatchingBenchmarkMetrics,
  AdvancedMatchingBenchmarkObservation,
} from '../model/advanced-matching-benchmark.types';

const ratio = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : numerator / denominator;

const expectedHits = (
  observations: readonly AdvancedMatchingBenchmarkObservation[],
  limit: number,
): readonly [number, number] =>
  observations.reduce<[number, number]>(
    ([hits, expected], observation) => {
      const returned = new Set(observation.retrievedEntityIds.slice(0, limit));
      return [
        hits + observation.expectedEntityIds.filter((entityId) => returned.has(entityId)).length,
        expected + observation.expectedEntityIds.length,
      ];
    },
    [0, 0],
  );

const setHits = (
  observations: readonly AdvancedMatchingBenchmarkObservation[],
  expectedKey: 'expectedRegionalEntityIds' | 'expectedStructureFirstEntityIds',
  actualKey: 'regionalEntityIds' | 'structureFirstEntityIds',
): readonly [number, number] =>
  observations.reduce<[number, number]>(
    ([hits, expected], observation) => {
      const actual = new Set(observation[actualKey]);
      return [
        hits + observation[expectedKey].filter((entityId) => actual.has(entityId)).length,
        expected + observation[expectedKey].length,
      ];
    },
    [0, 0],
  );

const sum = (
  observations: readonly AdvancedMatchingBenchmarkObservation[],
  key: keyof AdvancedMatchingBenchmarkObservation,
): number =>
  observations.reduce((total, observation) => {
    const value = observation[key];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);

const percentile = (values: readonly number[], percentileRank: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = values.toSorted((left, right) => left - right);
  const index = Math.ceil(percentileRank * sorted.length) - 1;
  return sorted[Math.max(0, index)] ?? 0;
};

const observationAgreement = (participantTopEntityIds: readonly string[]): number => {
  if (participantTopEntityIds.length === 0) {
    return 0;
  }
  const counts = new Map<string, number>();
  for (const entityId of participantTopEntityIds) {
    counts.set(entityId, (counts.get(entityId) ?? 0) + 1);
  }
  return Math.max(...counts.values()) / participantTopEntityIds.length;
};

const metricRatio = (
  observations: readonly AdvancedMatchingBenchmarkObservation[],
  numeratorKey: keyof AdvancedMatchingBenchmarkObservation,
  denominatorKey: keyof AdvancedMatchingBenchmarkObservation,
): number => ratio(sum(observations, numeratorKey), sum(observations, denominatorKey));

export const calculateAdvancedMatchingBenchmarkMetrics = (
  observations: readonly AdvancedMatchingBenchmarkObservation[],
): AdvancedMatchingBenchmarkMetrics => {
  const recall25 = expectedHits(observations, BENCHMARK_RECALL_LIMIT);
  const top10 = expectedHits(observations, BENCHMARK_TOP_TEN_LIMIT);
  const top5 = expectedHits(observations, BENCHMARK_TOP_FIVE_LIMIT);
  const regional = setHits(observations, 'expectedRegionalEntityIds', 'regionalEntityIds');
  const structure = setHits(
    observations,
    'expectedStructureFirstEntityIds',
    'structureFirstEntityIds',
  );
  return {
    expectedCandidateRecallAt25: ratio(...recall25),
    expectedCandidateTop10HitRate: ratio(...top10),
    expectedCandidateTop5HitRate: ratio(...top5),
    regionalRecall: ratio(...regional),
    structureFirstRecall: ratio(...structure),
    stableEvidencePrecision: metricRatio(
      observations,
      'supportedStableEvidenceClaims',
      'stableEvidenceClaims',
    ),
    unsupportedTraitClaimRate: metricRatio(
      observations,
      'unsupportedTraitClaims',
      'totalTraitClaims',
    ),
    majorContradictionRate: metricRatio(observations, 'majorContradictions', 'evaluatedCandidates'),
    crossModelAgreement: ratio(
      observations.reduce(
        (total, observation) => total + observationAgreement(observation.participantTopEntityIds),
        0,
      ),
      observations.length,
    ),
    entityResolutionAccuracy: metricRatio(
      observations,
      'correctlyResolvedEntities',
      'entityResolutionAttempts',
    ),
    licensedImageCoverage: metricRatio(observations, 'licensedImages', 'enrichedEntities'),
    wrongLanguageRate: metricRatio(observations, 'wrongLanguageResponses', 'localizedResponses'),
    latencyP50Ms: percentile(
      observations.map((observation) => observation.latencyMs),
      BENCHMARK_P50_RANK,
    ),
    latencyP95Ms: percentile(
      observations.map((observation) => observation.latencyMs),
      BENCHMARK_P95_RANK,
    ),
    costPerAnalysisUsd: ratio(sum(observations, 'costUsd'), observations.length),
  };
};
