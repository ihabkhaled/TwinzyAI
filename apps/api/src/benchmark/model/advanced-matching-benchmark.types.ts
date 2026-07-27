export interface AdvancedMatchingBenchmarkObservation {
  readonly expectedEntityIds: readonly string[];
  readonly retrievedEntityIds: readonly string[];
  readonly expectedRegionalEntityIds: readonly string[];
  readonly regionalEntityIds: readonly string[];
  readonly expectedStructureFirstEntityIds: readonly string[];
  readonly structureFirstEntityIds: readonly string[];
  readonly supportedStableEvidenceClaims: number;
  readonly stableEvidenceClaims: number;
  readonly unsupportedTraitClaims: number;
  readonly totalTraitClaims: number;
  readonly majorContradictions: number;
  readonly evaluatedCandidates: number;
  readonly participantTopEntityIds: readonly string[];
  readonly correctlyResolvedEntities: number;
  readonly entityResolutionAttempts: number;
  readonly licensedImages: number;
  readonly enrichedEntities: number;
  readonly wrongLanguageResponses: number;
  readonly localizedResponses: number;
  readonly latencyMs: number;
  readonly costUsd: number;
}

export interface AdvancedMatchingBenchmarkMetrics {
  readonly expectedCandidateRecallAt25: number;
  readonly expectedCandidateTop10HitRate: number;
  readonly expectedCandidateTop5HitRate: number;
  readonly regionalRecall: number;
  readonly structureFirstRecall: number;
  readonly stableEvidencePrecision: number;
  readonly unsupportedTraitClaimRate: number;
  readonly majorContradictionRate: number;
  readonly crossModelAgreement: number;
  readonly entityResolutionAccuracy: number;
  readonly licensedImageCoverage: number;
  readonly wrongLanguageRate: number;
  readonly latencyP50Ms: number;
  readonly latencyP95Ms: number;
  readonly costPerAnalysisUsd: number;
}
