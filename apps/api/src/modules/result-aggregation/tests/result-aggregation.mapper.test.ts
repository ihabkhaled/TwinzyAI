import { describe, expect, it } from 'vitest';

import type { JudgedResult } from '@twinzy/shared';
import { DEFAULT_RESULT_COUNT, GAME_PROMPT_VERSION, RESULT_DISCLAIMER } from '@twinzy/shared';

import {
  buildJudgedResultPayload,
  buildTraitExtraction,
} from '../../../tests/fixtures/fake-ai-adapter';
import {
  toFallbackResult,
  toFinalGameResult,
  toFinalResultItem,
} from '../lib/result-aggregation.mapper';

describe('result-aggregation mapper', () => {
  it('maps a judged result to a final item with 1-based rank', () => {
    const judged = buildJudgedResultPayload({ finalStyleVibeFitScore: 88 }) as JudgedResult;
    const item = toFinalResultItem(judged, 2);
    expect(item.rank).toBe(3);
    expect(item.name).toBe(judged.name);
    expect(item.finalStyleVibeFitScore).toBe(88);
  });

  it('builds a final game result with server-side disclaimer', () => {
    const extraction = buildTraitExtraction();
    const judged = buildJudgedResultPayload() as JudgedResult;
    const result = toFinalGameResult(extraction, [judged], 'en', DEFAULT_RESULT_COUNT);
    expect(result.promptVersion).toBe(GAME_PROMPT_VERSION);
    expect(result.languageCode).toBe('en');
    expect(result.resultCount).toBe(DEFAULT_RESULT_COUNT);
    expect(result.disclaimer).toBe(RESULT_DISCLAIMER);
    expect(result.results).toHaveLength(1);
  });

  it('builds a fallback result with localized fallback message', () => {
    const extraction = buildTraitExtraction();
    const result = toFallbackResult(extraction, 'en', DEFAULT_RESULT_COUNT);
    expect(result.results).toEqual([]);
    expect(result.fallbackMessage).toBeTruthy();
    expect(result.disclaimer).toBe(RESULT_DISCLAIMER);
  });
});
