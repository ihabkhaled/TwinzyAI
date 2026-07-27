import type { Candidate, JudgedResult } from '@twinzy/shared';

export const collectCandidateLocalizedValues = (
  candidates: readonly Candidate[],
): readonly string[] =>
  candidates.flatMap((candidate) => [
    candidate.countryOrRegion,
    candidate.reason,
    ...candidate.strongAlignedTraits,
    ...candidate.mediumAlignedTraits,
    ...candidate.weakOrUncertainTraits,
    ...candidate.majorMismatchRisks,
    candidate.whyThisCandidateWasChosen,
    candidate.scoreExplanation,
  ]);

export const collectCandidateLanguageExclusions = (
  candidates: readonly Candidate[],
): readonly string[] =>
  candidates.flatMap((candidate) => [
    candidate.name,
    ...(candidate.entityId === undefined ? [] : [candidate.entityId]),
  ]);

export const collectJudgedLocalizedValues = (results: readonly JudgedResult[]): readonly string[] =>
  results.flatMap((result) => [
    result.countryOrRegion,
    result.finalReason,
    ...result.topMatchingTraits,
    ...result.secondaryMatchingTraits,
    ...result.weakOrUncertainTraits,
    ...result.mismatchWarnings,
    result.judgeNotes,
  ]);

export const collectJudgedLanguageExclusions = (
  results: readonly JudgedResult[],
): readonly string[] =>
  results.flatMap((result) => [
    result.name,
    ...(result.entityId === undefined ? [] : [result.entityId]),
  ]);
