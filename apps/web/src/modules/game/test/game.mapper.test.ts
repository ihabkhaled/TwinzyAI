import { describe, expect, it } from 'vitest';

import { mapFinalResultToView } from '../mappers/game.mapper';

import { buildFinalResult, fakeTranslate } from './game-fixtures';

describe('mapFinalResultToView', () => {
  it('maps all 15 traits with translated labels and values', () => {
    const view = mapFinalResultToView(buildFinalResult(), fakeTranslate);

    expect(view.traits).toHaveLength(15);
    expect(view.traits[0]).toEqual({
      key: 'faceShape',
      label: 'result.traits.faceShape',
      value: 'observed faceShape',
    });
  });

  it('maps results with score, translated verdict label, and hasResults', () => {
    const view = mapFinalResultToView(buildFinalResult(), fakeTranslate);

    expect(view.results[0]?.scorePercent).toBe(87);
    expect(view.results[0]?.verdictLabel).toBe('result.verdict.strong');
    expect(view.hasResults).toBe(true);
    expect(view.disclaimer).toBe(buildFinalResult().disclaimer);
  });

  it('reports no results and empty share text when the backend returns none', () => {
    const view = mapFinalResultToView(buildFinalResult({ results: [] }), fakeTranslate);

    expect(view.hasResults).toBe(false);
    expect(view.shareText).toBe('');
  });

  it('builds safe share text with name and score only', () => {
    const view = mapFinalResultToView(buildFinalResult(), fakeTranslate);
    const lowered = view.shareText.toLowerCase();

    expect(view.shareText).toBe(
      'I tried this fun vibe game and got: Sample Star with 87% style/vibe fit.',
    );
    expect(lowered).not.toContain('biometric');
    expect(lowered).not.toContain('face recognition');
    expect(lowered).not.toContain('identity');
    expect(lowered).not.toContain('{');
  });
});
