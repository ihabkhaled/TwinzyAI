import type { CandidateJudgeResponse, ConsensusFinalExplanation } from '@twinzy/shared';

export const applyConsensusExplanations = (
  authoritative: CandidateJudgeResponse,
  explanations: readonly ConsensusFinalExplanation[],
): CandidateJudgeResponse => {
  const byEntityId = new Map(
    explanations.map((explanation) => [explanation.entityId, explanation]),
  );
  return {
    ...authoritative,
    results: authoritative.results.map((result) => {
      const explanation =
        result.entityId === undefined ? undefined : byEntityId.get(result.entityId);
      return explanation === undefined
        ? result
        : {
            ...result,
            finalReason: explanation.finalReason,
            mismatchWarnings: explanation.mismatchWarnings,
            judgeNotes: explanation.judgeNotes,
          };
    }),
  };
};
