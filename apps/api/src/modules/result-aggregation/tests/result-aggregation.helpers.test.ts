import { describe, expect, it } from 'vitest';

import type { CandidateJudgeResponse, JudgedResult } from '@twinzy/shared';
import { GAME_PROMPT_VERSION, Verdict } from '@twinzy/shared';

import { buildJudgedResultPayload } from '../../../tests/fixtures/fake-ai-adapter';
import { isDisplayableResult, selectDisplayableResults } from '../lib/result-aggregation.helpers';

describe('result-aggregation helpers', () => {
  describe('isDisplayableResult', () => {
    it('returns true for a strong, high-score result with evidence', () => {
      const result = buildJudgedResultPayload({
        verdict: 'strong',
        finalStyleVibeFitScore: 85,
      }) as JudgedResult;
      expect(isDisplayableResult(result)).toBe(true);
    });

    it('returns false for a weak verdict', () => {
      const result = buildJudgedResultPayload({ verdict: Verdict.Weak }) as JudgedResult;
      expect(isDisplayableResult(result)).toBe(false);
    });

    it('returns false for a score below the display threshold', () => {
      const result = buildJudgedResultPayload({ finalStyleVibeFitScore: 50 }) as JudgedResult;
      expect(isDisplayableResult(result)).toBe(false);
    });

    it('returns false when minimum evidence is missing', () => {
      const result = buildJudgedResultPayload({
        safetyCheck: { meetsMinimumEvidence: false },
      }) as JudgedResult;
      expect(isDisplayableResult(result)).toBe(false);
    });
  });

  describe('selectDisplayableResults', () => {
    it('filters, sorts, and caps results by requested count', () => {
      const results: JudgedResult[] = [
        buildJudgedResultPayload({ name: 'A', finalStyleVibeFitScore: 95 }) as JudgedResult,
        buildJudgedResultPayload({ name: 'B', finalStyleVibeFitScore: 75 }) as JudgedResult,
        buildJudgedResultPayload({ name: 'C', finalStyleVibeFitScore: 85 }) as JudgedResult,
      ];
      const response: CandidateJudgeResponse = {
        promptVersion: GAME_PROMPT_VERSION,
        languageCode: 'en',
        resultCount: 2,
        results,
        removedCandidates: [],
        fallbackMessage: '',
        disclaimer:
          'This is a playful style-vibe game, not identity or facial-similarity analysis.',
      };
      const selected = selectDisplayableResults(response, 2);
      expect(selected).toHaveLength(2);
      expect(selected.map((result) => result.name)).toEqual(['A', 'C']);
    });
  });
});
