import type { ModelJudgeReport } from '@twinzy/shared';

import {
  CONSENSUS_AGREEMENT_SPREAD_DIVISOR,
  CONSENSUS_CONTRADICTION_PENALTY_WEIGHT,
  CONSENSUS_EVEN_DIVISOR,
  CONSENSUS_MAX_AGREEMENT_BONUS,
  CONSENSUS_MAX_CROSS_LANE_BONUS,
  CONSENSUS_MAX_RETRIEVAL_BONUS,
  CONSENSUS_MAX_SCORE,
  CONSENSUS_MIN_SCORE,
  CONSENSUS_QUALITY_CAP_PENALTY,
  CONSENSUS_SCORING_WEIGHTS,
  CONSENSUS_UNCERTAINTY_PENALTY_WEIGHT,
  CONSENSUS_UNSUPPORTED_CLAIM_PENALTY,
} from '../model/consensus-scoring.constants';
import type {
  ConsensusScoringInput,
  ConsensusScoringResult,
} from '../model/consensus-scoring.types';

const median = (values: readonly number[]): number => {
  const sorted = values.toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / CONSENSUS_EVEN_DIVISOR);
  const middleValue = sorted[middle] ?? 0;
  if (sorted.length % CONSENSUS_EVEN_DIVISOR === 1) {
    return middleValue;
  }
  return ((sorted[middle - 1] ?? 0) + middleValue) / CONSENSUS_EVEN_DIVISOR;
};

const uniqueEvidence = (
  reports: readonly ModelJudgeReport[],
  key: 'supportedSignalIds' | 'contradictedSignalIds',
): string[] => [...new Set(reports.flatMap((report) => report[key]))];

const agreementBonus = (reports: readonly ModelJudgeReport[]): number => {
  const scores = reports.map((report) => report.stableEvidenceScore);
  const spread = Math.max(...scores) - Math.min(...scores);
  return Math.max(
    CONSENSUS_MIN_SCORE,
    CONSENSUS_MAX_AGREEMENT_BONUS - spread / CONSENSUS_AGREEMENT_SPREAD_DIVISOR,
  );
};

const baseScore = (reports: readonly ModelJudgeReport[]): number =>
  median(reports.map((report) => report.stableEvidenceScore)) * CONSENSUS_SCORING_WEIGHTS.stable +
  median(reports.map((report) => report.mutableStyleScore)) * CONSENSUS_SCORING_WEIGHTS.mutable +
  median(reports.map((report) => report.expressionScore)) * CONSENSUS_SCORING_WEIGHTS.expression +
  median(reports.map((report) => report.confidence)) * CONSENSUS_SCORING_WEIGHTS.confidence;

const penalty = (input: ConsensusScoringInput): number =>
  median(input.reports.map((report) => report.contradictionSeverity)) *
    CONSENSUS_CONTRADICTION_PENALTY_WEIGHT +
  median(input.reports.map((report) => report.uncertaintyPenalty)) *
    CONSENSUS_UNCERTAINTY_PENALTY_WEIGHT +
  median(input.reports.map((report) => report.unsupportedClaims.length)) *
    CONSENSUS_UNSUPPORTED_CLAIM_PENALTY +
  input.qualityCapCount * CONSENSUS_QUALITY_CAP_PENALTY;

const bonus = (input: ConsensusScoringInput): number =>
  agreementBonus(input.reports) +
  Math.max(CONSENSUS_MIN_SCORE, Math.min(input.retrievalScore, CONSENSUS_MAX_RETRIEVAL_BONUS)) +
  Math.max(CONSENSUS_MIN_SCORE, Math.min(input.crossLaneCount, CONSENSUS_MAX_CROSS_LANE_BONUS));

const clampScore = (score: number): number => {
  const upperBounded = Math.min(CONSENSUS_MAX_SCORE, score);
  return Math.round(Math.max(CONSENSUS_MIN_SCORE, upperBounded));
};

export const calculateConsensusScore = (input: ConsensusScoringInput): ConsensusScoringResult => ({
  entityId: input.entityId,
  finalScore: clampScore(baseScore(input.reports) + bonus(input) - penalty(input)),
  confidence: Math.round(median(input.reports.map((report) => report.confidence))),
  supportedSignalIds: uniqueEvidence(input.reports, 'supportedSignalIds'),
  contradictedSignalIds: uniqueEvidence(input.reports, 'contradictedSignalIds'),
});
