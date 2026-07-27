import { describe, expect, it } from 'vitest';

import type { QualitativeMatchingProfile } from '@twinzy/shared';
import {
  MatchingSignalConfidence,
  MatchingSignalModifier,
  MatchingSignalVisibility,
} from '@twinzy/shared';

import { buildNormalizedMatchingProfile } from '../lib/matching-profile.builder';

const profile: QualitativeMatchingProfile = {
  stableVisibleStructure: [
    {
      id: 'jaw.shape',
      value: 'unclear beneath dense facial hair',
      confidence: MatchingSignalConfidence.High,
      weight: 9,
      visibility: MatchingSignalVisibility.Occluded,
      affectedBy: [MatchingSignalModifier.FacialHair],
    },
    {
      id: 'eyes.spacing',
      value: 'balanced spacing',
      confidence: MatchingSignalConfidence.High,
      weight: 8,
      visibility: MatchingSignalVisibility.Visible,
      affectedBy: [],
    },
  ],
  mutableStyleSignals: [
    {
      id: 'eyewear.style',
      value: 'dark rectangular frames',
      confidence: MatchingSignalConfidence.High,
      weight: 8,
      visibility: MatchingSignalVisibility.Visible,
      affectedBy: [MatchingSignalModifier.Eyewear],
    },
  ],
  expressionAndPresentation: [],
  occludedOrUncertainSignals: [],
  contradictionsToAvoid: [],
  accessoryAgnosticSignals: [],
  imageQualityCaps: [],
};

const visibleEyeSignal = profile.stableVisibleStructure[1];

describe('buildNormalizedMatchingProfile', () => {
  it('downgrades occluded structure and keeps directly visible structure authoritative', () => {
    const normalized = buildNormalizedMatchingProfile(profile);

    expect(normalized.stableVisibleStructure).toEqual([
      expect.objectContaining({
        id: 'jaw.shape',
        confidence: MatchingSignalConfidence.Low,
        weight: 2,
      }),
      expect.objectContaining({ id: 'eyes.spacing', weight: 8 }),
    ]);
    expect(normalized.occludedOrUncertainSignals.map((signal) => signal.id)).toContain('jaw.shape');
  });

  it('builds an accessory-agnostic view without inventing or retaining accessory signals', () => {
    const normalized = buildNormalizedMatchingProfile(profile);

    expect(normalized.accessoryAgnosticSignals.map((signal) => signal.id)).toEqual([
      'eyes.spacing',
    ]);
    expect(normalized.accessoryAgnosticSignals).not.toContainEqual(
      expect.objectContaining({ id: 'jaw.shape' }),
    );
  });

  it('deduplicates equivalent signal ids by retaining the more conservative observation', () => {
    expect(visibleEyeSignal).toBeDefined();
    if (visibleEyeSignal === undefined) {
      throw new Error('Test fixture is missing the visible eye signal');
    }
    const normalized = buildNormalizedMatchingProfile({
      ...profile,
      stableVisibleStructure: [visibleEyeSignal, { ...visibleEyeSignal, weight: 5 }],
    });

    expect(normalized.stableVisibleStructure).toHaveLength(1);
    expect(normalized.stableVisibleStructure[0]?.weight).toBe(5);
  });
});
