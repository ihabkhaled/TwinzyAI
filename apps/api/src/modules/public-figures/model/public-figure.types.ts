import type { PublicFigureEnrichment, PublicFigureProfile } from '@twinzy/shared';

import type { PublicFigureRetrievalLaneValue } from './public-figure.constants';

export interface PublicFigureRetrievalResult {
  readonly entityId: string;
  readonly profile: PublicFigureProfile;
  readonly laneIds: readonly PublicFigureRetrievalLaneValue[];
  readonly retrievalScore: number;
  readonly stableEvidenceCoverage: number;
  readonly mutableEvidenceCoverage: number;
  readonly contradictionCount: number;
  readonly sourceConfidence: number;
}

export interface PublicFigureRetrievalEvidence {
  readonly stableValues: readonly string[];
  readonly accessoryAgnosticValues: readonly string[];
  readonly mutableValues: readonly string[];
  readonly presentationValues: readonly string[];
  readonly contradictionValues: readonly string[];
}

export interface PublicFigureMetadataCache {
  get(entityId: string, languageCode: string): Promise<PublicFigureEnrichment | undefined>;
  set(
    entityId: string,
    languageCode: string,
    value: PublicFigureEnrichment,
    ttlSeconds: number,
  ): Promise<void>;
}

export interface PublicFigureCacheEntry {
  readonly expiresAt: number;
  readonly value: PublicFigureEnrichment;
}
