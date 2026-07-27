import type { Candidate } from '@twinzy/shared';

import type { PublicFigureRetrievalService } from '../../public-figures';

export const attachCatalogEvidence = (
  candidates: readonly Candidate[],
  catalog: ReturnType<PublicFigureRetrievalService['retrieve']>,
): Candidate[] => {
  const byEntityId = new Map(catalog.map((item) => [item.entityId, item]));
  return candidates.flatMap((candidate) => {
    const catalogItem =
      candidate.entityId === undefined ? undefined : byEntityId.get(candidate.entityId);
    return catalogItem === undefined
      ? []
      : [
          {
            ...candidate,
            retrievalScore: catalogItem.retrievalScore,
            retrievalLaneIds: [...catalogItem.laneIds],
            stableEvidenceCoverage: catalogItem.stableEvidenceCoverage,
          },
        ];
  });
};
