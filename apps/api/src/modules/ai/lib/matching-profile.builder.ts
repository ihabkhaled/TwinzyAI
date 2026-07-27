import {
  type MatchingSignal,
  MatchingSignalConfidence,
  MatchingSignalModifier,
  type MatchingSignalModifierValue,
  MatchingSignalVisibility,
  type QualitativeMatchingProfile,
} from '@twinzy/shared';

const OCCLUDED_MAX_WEIGHT = 2;

const ACCESSORY_MODIFIERS = new Set<MatchingSignalModifierValue>([
  MatchingSignalModifier.Eyewear,
  MatchingSignalModifier.FacialHair,
  MatchingSignalModifier.Hairstyle,
  MatchingSignalModifier.Clothing,
  MatchingSignalModifier.Accessories,
]);

const isOccluded = (signal: MatchingSignal): boolean =>
  signal.visibility === MatchingSignalVisibility.Occluded ||
  signal.visibility === MatchingSignalVisibility.Uncertain;

const normalizeSignal = (signal: MatchingSignal): MatchingSignal =>
  isOccluded(signal)
    ? {
        ...signal,
        confidence: MatchingSignalConfidence.Low,
        weight: Math.min(signal.weight, OCCLUDED_MAX_WEIGHT),
      }
    : signal;

const deduplicateSignals = (signals: readonly MatchingSignal[]): MatchingSignal[] => {
  const byId = new Map<string, MatchingSignal>();
  for (const rawSignal of signals) {
    const signal = normalizeSignal(rawSignal);
    const current = byId.get(signal.id);
    if (current === undefined || signal.weight < current.weight) {
      byId.set(signal.id, signal);
    }
  }
  const deduplicated: MatchingSignal[] = [];
  byId.forEach((signal) => {
    deduplicated.push(signal);
  });
  return deduplicated;
};

const isAccessoryAgnostic = (signal: MatchingSignal): boolean =>
  !isOccluded(signal) && signal.affectedBy.every((modifier) => !ACCESSORY_MODIFIERS.has(modifier));

export const buildNormalizedMatchingProfile = (
  profile: QualitativeMatchingProfile,
): QualitativeMatchingProfile => {
  const stableVisibleStructure = deduplicateSignals(profile.stableVisibleStructure);
  const explicitlyUncertain = deduplicateSignals(profile.occludedOrUncertainSignals);
  const occludedStable = stableVisibleStructure.filter((signal) => isOccluded(signal));

  return {
    stableVisibleStructure,
    mutableStyleSignals: deduplicateSignals(profile.mutableStyleSignals),
    expressionAndPresentation: deduplicateSignals(profile.expressionAndPresentation),
    occludedOrUncertainSignals: deduplicateSignals([...explicitlyUncertain, ...occludedStable]),
    contradictionsToAvoid: deduplicateSignals(profile.contradictionsToAvoid),
    accessoryAgnosticSignals: stableVisibleStructure.filter((signal) =>
      isAccessoryAgnostic(signal),
    ),
    imageQualityCaps: [...new Set(profile.imageQualityCaps)],
  };
};
