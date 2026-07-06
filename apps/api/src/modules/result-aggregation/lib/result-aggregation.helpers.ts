import type { CandidateJudgeResponse, JudgedResult } from '@twinzy/shared';
import { MAX_FINAL_RESULTS, MIN_DISPLAY_SCORE, Verdict } from '@twinzy/shared';

/**
 * A judged result is displayable only when the judge flagged it for display,
 * the verdict is not weak, and its final score clears the minimum threshold.
 */
export const isDisplayableResult = (result: JudgedResult): boolean =>
  result.shouldDisplay &&
  result.verdict !== Verdict.Weak &&
  result.finalStyleVibeFitScore >= MIN_DISPLAY_SCORE;

/**
 * Keep only displayable results, re-rank them by descending final score, and
 * cap the list at MAX_FINAL_RESULTS. Pure and side-effect free.
 */
export const selectDisplayableResults = (
  judgeResponse: CandidateJudgeResponse,
): readonly JudgedResult[] =>
  judgeResponse.results
    .filter((result) => isDisplayableResult(result))
    .toSorted((a, b) => b.finalStyleVibeFitScore - a.finalStyleVibeFitScore)
    .slice(0, MAX_FINAL_RESULTS);
