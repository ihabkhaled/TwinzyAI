import type { CandidateJudgeResponse, JudgedResult } from '@twinzy/shared';
import { MIN_DISPLAY_SCORE, Verdict } from '@twinzy/shared';

/**
 * A judged result is displayable only when the judge flagged it for display,
 * the verdict is not weak, its final score clears the minimum threshold, and
 * the judge's safety check confirms minimum evidence.
 */
export const isDisplayableResult = (result: JudgedResult): boolean =>
  result.shouldDisplay &&
  result.verdict !== Verdict.Weak &&
  result.finalStyleVibeFitScore >= MIN_DISPLAY_SCORE &&
  result.safetyCheck.meetsMinimumEvidence;

/**
 * Keep only displayable results, re-rank them by descending final score, and
 * cap the list at the requested resultCount. Pure and side-effect free.
 */
export const selectDisplayableResults = (
  judgeResponse: CandidateJudgeResponse,
  resultCount: number,
): readonly JudgedResult[] =>
  judgeResponse.results
    .filter((result) => isDisplayableResult(result))
    .toSorted((a, b) => b.finalStyleVibeFitScore - a.finalStyleVibeFitScore)
    .slice(0, resultCount);
