import { describe, expect, it } from 'vitest';

import {
  buildShareText,
  resolvePhase,
  resolveTraitLabel,
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

describe('trait and verdict labels', () => {
  it('resolves the label key through the injected translator', () => {
    expect(resolveTraitLabel(fakeTranslate, 'faceShape')).toBe('result.traits.faceShape');
    expect(resolveVerdictLabel(fakeTranslate, 'strong')).toBe('result.verdict.strong');
  });
});

describe('buildShareText', () => {
  const topResult: ResultView = {
    name: 'Aria',
    rank: 1,
    scorePercent: 90,
    verdict: 'strong',
    verdictLabel: 'Strong vibe fit',
    reason: 'reason',
    matchingTraits: [],
    weakOrUncertainTraits: [],
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
