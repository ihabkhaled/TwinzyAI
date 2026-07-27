import { describe, expect, it } from 'vitest';

import type { Candidate, CandidateJudgeResponse, JudgedResult } from '@twinzy/shared';
import { CandidateJudgeResponseSchema } from '@twinzy/shared';

import {
  buildCandidatePayload,
  buildJudgedResultPayload,
  buildJudgeJson,
  buildTraitExtraction,
} from '../../../tests/fixtures/fake-ai-adapter';
import { ConsensusScoringService } from '../application/consensus-scoring.service';
import { applyBackendConsensusScores } from '../lib/judge-consensus.mapper';
import { mergeCouncilJudgeResponses } from '../lib/judge-council-merge.util';
import type { JudgeCandidatesInput } from '../model/judge-input.types';

const result = (
  score: number,
  includeAssessment = true,
  entityId: string | undefined = 'Q100',
): JudgedResult =>
  ({
    ...buildJudgedResultPayload({
      entityId,
      finalStyleVibeFitScore: score,
      evidenceAssessment: includeAssessment
        ? {
            stableEvidenceScore: score,
            mutableStyleScore: 60,
            expressionScore: 70,
            contradictionSeverity: 0,
            uncertaintyPenalty: 0,
            confidence: 80,
            supportedSignalIds: ['stable-1'],
            contradictedSignalIds: [],
            unsupportedClaims: [],
          }
        : undefined,
    }),
  }) as unknown as JudgedResult;

const response = (judgedResult: JudgedResult): CandidateJudgeResponse =>
  CandidateJudgeResponseSchema.parse(JSON.parse(buildJudgeJson([judgedResult])));

const candidate = {
  ...buildCandidatePayload(),
  entityId: 'Q100',
  retrievalScore: 20,
  retrievalLaneIds: ['structure-first', 'broad-global'],
} as unknown as Candidate;

const input: JudgeCandidatesInput = {
  extraction: buildTraitExtraction(),
  candidates: [candidate],
  languageCode: 'en',
  resultCount: 1,
};

describe('applyBackendConsensusScores', () => {
  const scoring = new ConsensusScoringService();

  it('uses structured participant evidence instead of the maximum model score', () => {
    const responses = [response(result(60)), response(result(62)), response(result(100))];
    const merged = mergeCouncilJudgeResponses(responses);

    const scored = applyBackendConsensusScores(input, responses, merged, scoring);

    expect(scored.results[0]?.finalStyleVibeFitScore).toBeLessThan(80);
    expect(scored.results[0]?.finalStyleVibeFitScore).not.toBe(100);
  });

  it('preserves legacy, unresolved, and under-quorum results', () => {
    const single = response(result(70));
    expect(applyBackendConsensusScores(input, [single], single, scoring)).toBe(single);

    const unresolvedResponses = [
      response({ ...result(70), entityId: undefined }),
      response({ ...result(72), entityId: undefined }),
    ];
    const unresolvedMerged = mergeCouncilJudgeResponses(unresolvedResponses);
    expect(
      applyBackendConsensusScores(input, unresolvedResponses, unresolvedMerged, scoring),
    ).toEqual(unresolvedMerged);

    const underQuorum = [response(result(70)), response(result(72, false))];
    const underQuorumMerged = mergeCouncilJudgeResponses(underQuorum);
    expect(applyBackendConsensusScores(input, underQuorum, underQuorumMerged, scoring)).toEqual(
      underQuorumMerged,
    );
  });
});
