import type { PublicFigureProfile, QualitativeMatchingProfile } from '@twinzy/shared';

import {
  PUBLIC_FIGURE_CONTRADICTION_WEIGHT,
  PUBLIC_FIGURE_MAX_SOURCE_CONFIDENCE,
  PUBLIC_FIGURE_MUTABLE_MATCH_WEIGHT,
  PUBLIC_FIGURE_REGION_BY_LANGUAGE,
  PUBLIC_FIGURE_STABLE_MATCH_WEIGHT,
  PublicFigureRetrievalLane,
  type PublicFigureRetrievalLaneValue,
} from '../model/public-figure.constants';
import type {
  PublicFigureRetrievalEvidence,
  PublicFigureRetrievalResult,
} from '../model/public-figure.types';

const normalize = (value: string): string => value.trim().toLowerCase();

const normalizeMany = (values: readonly string[]): readonly string[] =>
  values.map((value) => normalize(value));

const signalValues = (
  signals: QualitativeMatchingProfile['stableVisibleStructure'],
): readonly string[] => normalizeMany(signals.map((signal) => signal.value));

export const toRetrievalEvidence = (
  profile: QualitativeMatchingProfile,
): PublicFigureRetrievalEvidence => ({
  stableValues: signalValues(profile.stableVisibleStructure),
  accessoryAgnosticValues: signalValues(profile.accessoryAgnosticSignals),
  mutableValues: signalValues(profile.mutableStyleSignals),
  presentationValues: signalValues(profile.expressionAndPresentation),
  contradictionValues: signalValues(profile.contradictionsToAvoid),
});

const countMatches = (evidence: readonly string[], tags: readonly string[]): number => {
  const normalizedTags = normalizeMany(tags);
  return evidence.filter((value) =>
    normalizedTags.some((tag) => tag.includes(value) || value.includes(tag)),
  ).length;
};

const laneIdsFor = (
  profile: PublicFigureProfile,
  evidence: PublicFigureRetrievalEvidence,
  languageCode: string,
): readonly PublicFigureRetrievalLaneValue[] => {
  const laneIds: PublicFigureRetrievalLaneValue[] = [PublicFigureRetrievalLane.BroadGlobal];
  if (countMatches(evidence.stableValues, profile.stableAppearanceTags) > 0) {
    laneIds.push(PublicFigureRetrievalLane.StructureFirst);
  }
  if (countMatches(evidence.accessoryAgnosticValues, profile.stableAppearanceTags) > 0) {
    laneIds.push(PublicFigureRetrievalLane.AccessoryAgnostic);
  }
  if (countMatches(evidence.mutableValues, profile.mutableStyleTags) > 0) {
    laneIds.push(PublicFigureRetrievalLane.HairAndFacialHair);
  }
  if (countMatches(evidence.presentationValues, profile.presentationTags) > 0) {
    laneIds.push(PublicFigureRetrievalLane.ExpressionAndPresentation);
  }
  const regionHints = PUBLIC_FIGURE_REGION_BY_LANGUAGE[languageCode] ?? [];
  if (regionHints.some((hint) => normalize(profile.countryOrRegion).includes(hint))) {
    laneIds.push(PublicFigureRetrievalLane.RegionalFirst);
  }
  return laneIds;
};

export const scorePublicFigureProfile = (
  profile: PublicFigureProfile,
  evidence: PublicFigureRetrievalEvidence,
  languageCode: string,
): PublicFigureRetrievalResult => {
  const stableEvidenceCoverage = countMatches(evidence.stableValues, profile.stableAppearanceTags);
  const mutableEvidenceCoverage = countMatches(evidence.mutableValues, profile.mutableStyleTags);
  const presentationCoverage = countMatches(evidence.presentationValues, profile.presentationTags);
  const contradictionCount = countMatches(
    evidence.contradictionValues,
    profile.stableAppearanceTags,
  );
  const retrievalScore =
    stableEvidenceCoverage * PUBLIC_FIGURE_STABLE_MATCH_WEIGHT +
    mutableEvidenceCoverage * PUBLIC_FIGURE_MUTABLE_MATCH_WEIGHT +
    presentationCoverage -
    contradictionCount * PUBLIC_FIGURE_CONTRADICTION_WEIGHT;

  return {
    entityId: profile.entityId,
    profile,
    laneIds: laneIdsFor(profile, evidence, languageCode),
    retrievalScore,
    stableEvidenceCoverage,
    mutableEvidenceCoverage,
    contradictionCount,
    sourceConfidence: profile.sourceReferences.length > 0 ? PUBLIC_FIGURE_MAX_SOURCE_CONFIDENCE : 0,
  };
};
