import type { Candidate } from '@twinzy/shared';

/**
 * Canonical form used to dedupe candidate names across lanes: trimmed,
 * lower-cased, and inner whitespace collapsed so "Omar  Sharif" and
 * "omar sharif" resolve to one figure.
 */
export const canonicalCandidateName = (name: string): string =>
  name.trim().toLowerCase().replaceAll(/\s+/gu, ' ');

/** Code-point comparison — deterministic across environments (unlike locale sort). */
const compareByName = (a: string, b: string): number => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

/**
 * Deterministically merge candidate pools produced by parallel lanes:
 * - dedupe by canonical name, keeping the higher styleVibeFitScore (ties keep
 *   the earlier lane's entry, and lanes are collected in fixed order)
 * - order the survivors by score desc, then canonical name asc
 *
 * Given the same lane outputs the result is identical regardless of the order
 * in which the lanes happened to finish.
 */
export const mergeCandidatePools = (pools: readonly (readonly Candidate[])[]): Candidate[] => {
  const survivors: Candidate[] = [];
  const indexByName = new Map<string, number>();
  for (const pool of pools) {
    for (const candidate of pool) {
      const key = canonicalCandidateName(candidate.name);
      const existingIndex = indexByName.get(key);
      const existing = existingIndex === undefined ? undefined : survivors[existingIndex];
      if (existingIndex === undefined || existing === undefined) {
        indexByName.set(key, survivors.length);
        survivors.push(candidate);
      } else if (candidate.styleVibeFitScore > existing.styleVibeFitScore) {
        survivors[existingIndex] = candidate;
      }
    }
  }
  return survivors.toSorted((a, b) => {
    if (b.styleVibeFitScore !== a.styleVibeFitScore) {
      return b.styleVibeFitScore - a.styleVibeFitScore;
    }
    return compareByName(canonicalCandidateName(a.name), canonicalCandidateName(b.name));
  });
};
