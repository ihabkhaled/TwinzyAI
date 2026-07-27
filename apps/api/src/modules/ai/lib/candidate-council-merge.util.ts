import type { Candidate } from '@twinzy/shared';

import { COUNCIL_MEDIAN_DIVISOR } from '../model/multi-model-council.constants';

const median = (values: readonly number[]): number => {
  const sorted = values.toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / COUNCIL_MEDIAN_DIVISOR);
  const upper = sorted[middle] ?? 0;
  const lower = sorted[middle - 1] ?? upper;
  return sorted.length % COUNCIL_MEDIAN_DIVISOR === 0
    ? Math.round((lower + upper) / COUNCIL_MEDIAN_DIVISOR)
    : upper;
};

const unique = (values: readonly (readonly string[] | undefined)[]): string[] => [
  ...new Set(values.flatMap((value) => value ?? [])),
];

export const mergeCouncilCandidates = (
  candidateSets: readonly (readonly Candidate[])[],
  limit: number,
): Candidate[] => {
  const grouped = new Map<string, Candidate[]>();
  for (const candidate of candidateSets.flat()) {
    if (candidate.entityId === undefined) {
      continue;
    }
    const group = grouped.get(candidate.entityId) ?? [];
    group.push(candidate);
    grouped.set(candidate.entityId, group);
  }
  const merged: Candidate[] = [];
  grouped.forEach((group, entityId) => {
    const representative = group[0];
    if (representative !== undefined) {
      merged.push({
        ...representative,
        entityId,
        styleVibeFitScore: median(group.map((candidate) => candidate.styleVibeFitScore)),
        supportedSignalIds: unique(group.map((candidate) => candidate.supportedSignalIds)),
        contradictedSignalIds: unique(group.map((candidate) => candidate.contradictedSignalIds)),
      });
    }
  });
  return merged
    .toSorted((left, right) => right.styleVibeFitScore - left.styleVibeFitScore)
    .slice(0, limit);
};
