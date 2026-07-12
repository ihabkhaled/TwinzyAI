import { describe, expect, it } from 'vitest';

import type { Candidate } from '@twinzy/shared';

import { canonicalCandidateName, mergeCandidatePools } from '../lib/candidate-merge.util';

/** mergeCandidatePools only reads `name` + `styleVibeFitScore`. */
const candidate = (name: string, styleVibeFitScore: number): Candidate =>
  ({ name, styleVibeFitScore }) as unknown as Candidate;

describe('canonicalCandidateName', () => {
  it('trims, lower-cases, and collapses inner whitespace', () => {
    expect(canonicalCandidateName('  Omar   Sharif ')).toBe('omar sharif');
    expect(canonicalCandidateName('OMAR SHARIF')).toBe('omar sharif');
  });
});

describe('mergeCandidatePools', () => {
  it('returns an empty list for empty pools', () => {
    expect(mergeCandidatePools([])).toEqual([]);
    expect(mergeCandidatePools([[], []])).toEqual([]);
  });

  it('dedupes by canonical name, keeping the higher-scored entry', () => {
    const merged = mergeCandidatePools([
      [candidate('Star A', 70)],
      [candidate('star a', 88), candidate('Star B', 60)],
    ]);

    expect(merged.map((entry) => entry.name)).toEqual(['star a', 'Star B']);
    expect(merged[0]?.styleVibeFitScore).toBe(88);
  });

  it('orders survivors by score desc, then canonical name asc — order-independent', () => {
    const poolOrderOne = mergeCandidatePools([
      [candidate('Bravo', 80), candidate('Alpha', 80)],
      [candidate('Charlie', 95)],
    ]);
    const poolOrderTwo = mergeCandidatePools([
      [candidate('Charlie', 95)],
      [candidate('Alpha', 80), candidate('Bravo', 80)],
    ]);

    expect(poolOrderOne.map((entry) => entry.name)).toEqual(['Charlie', 'Alpha', 'Bravo']);
    expect(poolOrderTwo.map((entry) => entry.name)).toEqual(
      poolOrderOne.map((entry) => entry.name),
    );
  });
});
