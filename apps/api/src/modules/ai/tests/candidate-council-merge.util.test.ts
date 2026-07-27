import { describe, expect, it } from 'vitest';

import type { Candidate } from '@twinzy/shared';

import { mergeCouncilCandidates } from '../lib/candidate-council-merge.util';

const candidate = (score: number): Candidate => ({
  entityId: 'Q170515',
  name: 'Omar Sharif',
  publicCategory: 'actor',
  countryOrRegion: 'Egypt',
  globalPopularityLevel: 'high',
  styleVibeFitScore: score,
  confidenceLevel: 'high',
  reason: 'Written-trait evidence.',
  strongAlignedTraits: ['oval face'],
  mediumAlignedTraits: [],
  weakOrUncertainTraits: [],
  majorMismatchRisks: [],
  whyThisCandidateWasChosen: 'Stable evidence.',
  scoreExplanation: 'Median evidence score.',
  supportedSignalIds: ['stable-1'],
  contradictedSignalIds: [],
  safetyCheck: {
    containsFaceRecognitionClaim: false,
    containsBiometricClaim: false,
    containsIdentityClaim: false,
    containsExactLookalikeClaim: false,
  },
});

describe('mergeCouncilCandidates', () => {
  it('uses the participant median so one exaggerated model cannot dominate', () => {
    const result = mergeCouncilCandidates([[candidate(20)], [candidate(30)], [candidate(100)]], 10);

    expect(result[0]?.styleVibeFitScore).toBe(30);
    expect(result[0]?.entityId).toBe('Q170515');
  });

  it('uses a rounded mean for an even council and merges cited signal ids', () => {
    const first = {
      ...candidate(20),
      supportedSignalIds: ['stable-1'],
      contradictedSignalIds: undefined,
    };
    const second = {
      ...candidate(31),
      supportedSignalIds: ['stable-1', 'stable-2'],
      contradictedSignalIds: ['stable-3'],
    };

    const result = mergeCouncilCandidates([[first], [second]], 10);

    expect(result[0]).toMatchObject({
      styleVibeFitScore: 26,
      supportedSignalIds: ['stable-1', 'stable-2'],
      contradictedSignalIds: ['stable-3'],
    });
  });

  it('drops unresolved candidates, sorts by score, and applies the configured limit', () => {
    const unresolved = { ...candidate(100), entityId: undefined };
    const lower = { ...candidate(30), entityId: 'Q2', name: 'Lower' };
    const higher = { ...candidate(60), entityId: 'Q3', name: 'Higher' };

    const result = mergeCouncilCandidates([[unresolved, lower, higher]], 1);

    expect(result).toHaveLength(1);
    expect(result[0]?.entityId).toBe('Q3');
  });
});
