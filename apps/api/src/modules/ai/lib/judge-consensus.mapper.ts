import type {
  Candidate,
  CandidateJudgeResponse,
  JudgedResult,
  ModelJudgeReport,
} from '@twinzy/shared';

import type { ConsensusScoringService } from '../application/consensus-scoring.service';
import { CONSENSUS_MIN_REPORTS } from '../model/consensus-scoring.constants';
import type { JudgeCandidatesInput } from '../model/judge-input.types';

const reportsFor = (
  entityId: string,
  responses: readonly CandidateJudgeResponse[],
): ModelJudgeReport[] =>
  responses.flatMap((response, index) => {
    const result = response.results.find((item) => item.entityId === entityId);
    return result?.evidenceAssessment === undefined
      ? []
      : [
          {
            participantId: `participant-${index + 1}`,
            entityId,
            ...result.evidenceAssessment,
            shouldKeep: result.shouldDisplay,
          },
        ];
  });

const candidateFor = (entityId: string, candidates: readonly Candidate[]): Candidate | undefined =>
  candidates.find((candidate) => candidate.entityId === entityId);

const qualityCapCount = (input: JudgeCandidatesInput): number =>
  input.extraction.matchingProfile?.imageQualityCaps.length ??
  input.extraction.imageQualityCaps.length;

const scoreResult = (
  result: JudgedResult,
  responses: readonly CandidateJudgeResponse[],
  input: JudgeCandidatesInput,
  scoring: ConsensusScoringService,
): JudgedResult => {
  if (result.entityId === undefined) {
    return result;
  }
  const reports = reportsFor(result.entityId, responses);
  if (reports.length < CONSENSUS_MIN_REPORTS) {
    return result;
  }
  const candidate = candidateFor(result.entityId, input.candidates);
  const consensus = scoring.score({
    entityId: result.entityId,
    reports,
    retrievalScore: candidate?.retrievalScore ?? 0,
    crossLaneCount: candidate?.retrievalLaneIds?.length ?? 0,
    qualityCapCount: qualityCapCount(input),
  });
  return { ...result, finalStyleVibeFitScore: consensus.finalScore };
};

export const applyBackendConsensusScores = (
  input: JudgeCandidatesInput,
  responses: readonly CandidateJudgeResponse[],
  merged: CandidateJudgeResponse,
  scoring: ConsensusScoringService,
): CandidateJudgeResponse =>
  responses.length < CONSENSUS_MIN_REPORTS
    ? merged
    : {
        ...merged,
        results: merged.results.map((result) => scoreResult(result, responses, input, scoring)),
      };
