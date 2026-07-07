import { describe, expect, it } from 'vitest';

import {
  buildShareText,
  resolveConfidenceLabel,
  resolvePhase,
  resolveTraitCategoryTitle,
  resolveTraitFieldLabel,
  resolveVerdictLabel,
} from '../helpers/game-display.helper';
import { GamePhase } from '../model/game.enums';
import type { ResultView } from '../model/game.types';

import { fakeTranslate } from './game-fixtures';

describe('resolvePhase', () => {
  it('prefers pending, then success, then error, else setup', () => {
    expect(resolvePhase(true, false, false)).toBe(GamePhase.Processing);
    expect(resolvePhase(false, true, false)).toBe(GamePhase.Success);
    expect(resolvePhase(false, false, true)).toBe(GamePhase.Error);
    expect(resolvePhase(false, false, false)).toBe(GamePhase.Setup);
  });
});

describe('trait, verdict, and confidence labels', () => {
  it('resolves category, field, verdict, and confidence keys through the translator', () => {
    expect(resolveTraitCategoryTitle(fakeTranslate, 'hair')).toBe('result.traitCategories.hair');
    expect(resolveTraitFieldLabel(fakeTranslate, 'hair', 'hairColor')).toBe(
      'result.traitFields.hair.hairColor',
    );
    expect(resolveVerdictLabel(fakeTranslate, 'strong')).toBe('result.verdict.strong');
    expect(resolveConfidenceLabel(fakeTranslate, 'high')).toBe('result.confidence.high');
  });
});

describe('buildShareText', () => {
  const topResult: ResultView = {
    name: 'Aria',
    rank: 1,
    scorePercent: 90,
    verdictLabel: 'Strong vibe fit',
    confidenceLabel: 'High confidence',
    countryOrRegion: 'Global',
    categoryLabel: 'Actor',
    reason: 'reason',
    topMatchingTraits: [],
    secondaryMatchingTraits: [],
    weakOrUncertainTraits: [],
    mismatchWarnings: [],
  };

  it('returns an empty string when there is no result', () => {
    expect(buildShareText([], fakeTranslate)).toBe('');
  });

  it('builds safe name + score share text from the top result', () => {
    expect(buildShareText([topResult], fakeTranslate)).toBe(
      'I tried this fun vibe game and got: Aria with 90% style/vibe fit.',
    );
  });
});
