import type { CandidateJudgeResponse, JudgedResult } from '@twinzy/shared';

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

export const mergeCouncilJudgeResponses = (
  responses: readonly CandidateJudgeResponse[],
): CandidateJudgeResponse => {
  const first = responses[0];
  if (first === undefined) {
    throw new Error('Judge council returned no responses');
  }
  if (responses.length === 1) {
    return first;
  }
  const groups = new Map<string, JudgedResult[]>();
  const councilResults = responses.flatMap((response) => response.results);
  for (const result of councilResults) {
    if (result.entityId === undefined) {
      continue;
    }
    const group = groups.get(result.entityId) ?? [];
    group.push(result);
    groups.set(result.entityId, group);
  }
  const results: JudgedResult[] = [];
  groups.forEach((group) => {
    const representative = group[0];
    if (representative !== undefined) {
      results.push({
        ...representative,
        finalStyleVibeFitScore: median(group.map((result) => result.finalStyleVibeFitScore)),
        shouldDisplay:
          group.filter((result) => result.shouldDisplay).length >=
          Math.ceil(group.length / COUNCIL_MEDIAN_DIVISOR),
      });
    }
  });
  return {
    ...first,
    results: results.toSorted(
      (left, right) => right.finalStyleVibeFitScore - left.finalStyleVibeFitScore,
    ),
    removedCandidates: responses.flatMap((response) => response.removedCandidates),
  };
};
