import {
  countPopulatedTraitFields,
  isRecord,
  MatchingSignalConfidence,
  MatchingSignalVisibility,
  MAX_TRAIT_REFERENCE_LENGTH,
} from '@twinzy/shared';

import type { TraitExtractionNormalizationResult } from '../model/trait-extraction-normalization.types';

const MATCHING_PROFILE_SIGNAL_FIELDS = [
  'stableVisibleStructure',
  'mutableStyleSignals',
  'expressionAndPresentation',
  'occludedOrUncertainSignals',
  'contradictionsToAvoid',
  'accessoryAgnosticSignals',
] as const;

const COUNTERFACTUAL_SIGNAL_FIELDS = [
  'withoutEyewear',
  'withoutFacialHair',
  'withoutMutableStyling',
] as const;

const canNormalizeSignal = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.trim().length <= MAX_TRAIT_REFERENCE_LENGTH;

const normalizeSignalArray = (value: unknown, path: string): TraitExtractionNormalizationResult => {
  if (!Array.isArray(value)) {
    return { value, normalizedSignalCount: 0 };
  }
  const items = value as unknown[];
  let normalizedSignalCount = 0;
  const normalized = items.map((item, index) => {
    if (!canNormalizeSignal(item)) {
      return item;
    }
    normalizedSignalCount += 1;
    return {
      id: `${path}.${index}`,
      value: item,
      confidence: MatchingSignalConfidence.Low,
      weight: 1,
      visibility: MatchingSignalVisibility.Uncertain,
      affectedBy: [],
    };
  });
  return { value: normalized, normalizedSignalCount };
};

const normalizeProfile = (
  value: unknown,
  parentPath: string,
  fields: readonly string[],
): TraitExtractionNormalizationResult => {
  if (!isRecord(value)) {
    return { value, normalizedSignalCount: 0 };
  }
  const normalized = { ...value };
  let normalizedSignalCount = 0;
  for (const field of fields) {
    const fieldResult = normalizeSignalArray(value[field], `${parentPath}.${field}`);
    normalized[field] = fieldResult.value;
    normalizedSignalCount += fieldResult.normalizedSignalCount;
  }
  return { value: normalized, normalizedSignalCount };
};

/**
 * Normalizes only the bounded shorthand observed from live extraction models.
 * Every recovered value still passes through the strict shared response schema;
 * unsupported types, empty/oversized strings, bad objects, and excess arrays
 * remain invalid.
 */
export const normalizeTraitExtractionInput = (
  value: unknown,
): TraitExtractionNormalizationResult => {
  if (!isRecord(value)) {
    return { value, normalizedSignalCount: 0 };
  }
  const matching = normalizeProfile(
    value['matchingProfile'],
    'matchingProfile',
    MATCHING_PROFILE_SIGNAL_FIELDS,
  );
  const counterfactuals = normalizeProfile(
    value['counterfactualProfiles'],
    'counterfactualProfiles',
    COUNTERFACTUAL_SIGNAL_FIELDS,
  );
  const traits = value['traits'];
  return {
    value: {
      ...value,
      ...(isRecord(traits) && { traitCount: countPopulatedTraitFields(traits) }),
      matchingProfile: matching.value,
      counterfactualProfiles: counterfactuals.value,
    },
    normalizedSignalCount: matching.normalizedSignalCount + counterfactuals.normalizedSignalCount,
  };
};
