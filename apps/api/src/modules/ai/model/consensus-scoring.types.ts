import type { ConsensusCandidate, ModelJudgeReport } from '@twinzy/shared';

export interface ConsensusScoringInput {
  readonly entityId: string;
  readonly reports: readonly ModelJudgeReport[];
  readonly retrievalScore: number;
  readonly crossLaneCount: number;
  readonly qualityCapCount: number;
}

export type ConsensusScoringResult = ConsensusCandidate;
