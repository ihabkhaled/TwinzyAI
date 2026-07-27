import type { AiRouteEntry } from './ai-route.types';

export interface AdvancedMatchingConfig {
  readonly enabled: boolean;
  readonly catalogEnabled: boolean;
  readonly ensembleEnabled: boolean;
  readonly crossCritiqueEnabled: boolean;
  readonly secondRetrievalPassEnabled: boolean;
  readonly enrichmentEnabled: boolean;
  readonly generationParticipants: readonly AiRouteEntry[];
  readonly judgeParticipants: readonly AiRouteEntry[];
  readonly critiqueParticipants: readonly AiRouteEntry[];
  readonly finalizer: AiRouteEntry | undefined;
  readonly minSuccessfulParticipants: number;
  readonly stepTimeoutMs: number;
  readonly maxCandidatesPerModel: number;
  readonly maxCombinedCandidates: number;
  readonly cacheTtlSeconds: number;
  readonly cacheMaxItems: number;
  readonly requestTimeoutMs: number;
  readonly maxResponseBytes: number;
}
