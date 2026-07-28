import { describe, expect, it } from 'vitest';

import { TraitExtractionResponseSchema } from '@twinzy/shared';

import { buildTraitExtractionPayload } from '../../../tests/fixtures/fake-ai-adapter';
import { normalizeTraitExtractionInput } from '../lib/trait-extraction-input.normalizer';

const buildProfileWith = (signal: unknown): Record<string, unknown> => ({
  stableVisibleStructure: [signal],
  mutableStyleSignals: [signal],
  expressionAndPresentation: [signal],
  occludedOrUncertainSignals: [signal],
  contradictionsToAvoid: [signal],
  accessoryAgnosticSignals: [signal],
  imageQualityCaps: [],
});

const buildCounterfactualsWith = (signal: unknown): Record<string, unknown> => ({
  withoutEyewear: [signal],
  withoutFacialHair: [signal],
  withoutMutableStyling: [signal],
});

describe('normalizeTraitExtractionInput', () => {
  it('leaves a non-object root untouched', () => {
    expect(normalizeTraitExtractionInput('not an object')).toEqual({
      value: 'not an object',
      normalizedSignalCount: 0,
    });
  });

  it('recovers the exact production string shorthand as conservative structured signals', () => {
    const payload = buildTraitExtractionPayload({
      matchingProfile: buildProfileWith('soft oval structure'),
      counterfactualProfiles: buildCounterfactualsWith('structure remains uncertain'),
    });

    const normalized = normalizeTraitExtractionInput(payload);
    const result = TraitExtractionResponseSchema.parse(normalized.value);

    expect(normalized.normalizedSignalCount).toBe(9);
    expect(result.matchingProfile?.mutableStyleSignals[0]).toEqual({
      id: 'matchingProfile.mutableStyleSignals.0',
      value: 'soft oval structure',
      confidence: 'low',
      weight: 1,
      visibility: 'uncertain',
      affectedBy: [],
    });
    expect(result.counterfactualProfiles?.withoutEyewear[0]).toEqual({
      id: 'counterfactualProfiles.withoutEyewear.0',
      value: 'structure remains uncertain',
      confidence: 'low',
      weight: 1,
      visibility: 'uncertain',
      affectedBy: [],
    });
  });

  it('leaves valid structured matching signals unchanged', () => {
    const signal = {
      id: 'overallFace.overallFaceShape',
      value: 'soft oval structure',
      confidence: 'high',
      weight: 8,
      visibility: 'visible',
      affectedBy: [],
    };
    const payload = buildTraitExtractionPayload({
      matchingProfile: buildProfileWith(signal),
      counterfactualProfiles: buildCounterfactualsWith(signal),
    });

    const normalized = normalizeTraitExtractionInput(payload);
    const result = TraitExtractionResponseSchema.parse(normalized.value);

    expect(normalized.normalizedSignalCount).toBe(0);
    expect(result.matchingProfile?.stableVisibleStructure[0]).toEqual(signal);
  });

  it('does not repair unsupported non-string values', () => {
    const payload = buildTraitExtractionPayload({
      matchingProfile: buildProfileWith(42),
      counterfactualProfiles: buildCounterfactualsWith(42),
    });

    const normalized = normalizeTraitExtractionInput(payload);

    expect(normalized.normalizedSignalCount).toBe(0);
    expect(TraitExtractionResponseSchema.safeParse(normalized.value).success).toBe(false);
  });

  it('leaves absent profiles and non-array signal fields for strict validation', () => {
    const payload = buildTraitExtractionPayload({
      matchingProfile: {
        ...buildProfileWith('valid shorthand'),
        mutableStyleSignals: 'not an array',
      },
      counterfactualProfiles: undefined,
    });

    const normalized = normalizeTraitExtractionInput(payload);

    expect(normalized.normalizedSignalCount).toBe(5);
    expect(TraitExtractionResponseSchema.safeParse(normalized.value).success).toBe(false);
  });

  it('does not repair empty or oversized strings', () => {
    const emptyPayload = buildTraitExtractionPayload({
      matchingProfile: buildProfileWith(' '.repeat(3)),
      counterfactualProfiles: buildCounterfactualsWith(' '.repeat(3)),
    });
    const oversizedPayload = buildTraitExtractionPayload({
      matchingProfile: buildProfileWith('x'.repeat(201)),
      counterfactualProfiles: buildCounterfactualsWith('x'.repeat(201)),
    });

    expect(
      TraitExtractionResponseSchema.safeParse(normalizeTraitExtractionInput(emptyPayload).value)
        .success,
    ).toBe(false);
    expect(
      TraitExtractionResponseSchema.safeParse(normalizeTraitExtractionInput(oversizedPayload).value)
        .success,
    ).toBe(false);
  });
});
