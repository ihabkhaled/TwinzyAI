import { describe, expect, it } from 'vitest';

import { TOTAL_TRAIT_FIELDS } from '@twinzy/shared';

import { mapFinalResultToView } from '../mappers/game.mapper';

import { buildFinalResult, fakeTranslate } from './game-fixtures';

describe('mapFinalResultToView', () => {
  it('maps the 15 detail categories with translated titles and field rows', () => {
    const view = mapFinalResultToView(buildFinalResult(), fakeTranslate);

    // imageQuality is excluded from the accordion — it has its own section.
    expect(view.categories).toHaveLength(15);
    expect(view.categories[0]?.title).toBe('result.traitCategories.overallFace');
    expect(view.categories[0]?.fields[0]).toEqual({
      key: 'overallFaceShape',
      label: 'result.traitFields.overallFace.overallFaceShape',
      value: 'observed overallFaceShape',
    });
    expect(view.imageQuality[0]?.key).toBe('lightingQuality');
    expect(view.traitCount).toBe(TOTAL_TRAIT_FIELDS);
    expect(view.compactTraitSummary).toEqual(['clear oval face', 'wavy dark hair']);
  });

  it('keeps only non-empty uncertainty groups with translated labels', () => {
    const view = mapFinalResultToView(buildFinalResult(), fakeTranslate);

    expect(view.uncertainty).toHaveLength(1);
    expect(view.uncertainty[0]?.label).toBe('result.uncertainty.imageLimitations');
    expect(view.uncertainty[0]?.notes).toEqual(['slightly dim lighting']);
  });

  it('renders a missing optional trait field as empty text', () => {
    const result = buildFinalResult();
    delete result.traits.hair['hairColor'];

    const view = mapFinalResultToView(result, fakeTranslate);
    const hair = view.categories.find((category) => category.key === 'hair');
    expect(hair?.fields.find((field) => field.key === 'hairColor')?.value).toBe('');
  });

  it('maps results with score, translated labels, and hasResults', () => {
    const view = mapFinalResultToView(buildFinalResult(), fakeTranslate);

    expect(view.results[0]?.scorePercent).toBe(84);
    expect(view.results[0]?.verdictLabel).toBe('result.verdict.strong');
    expect(view.results[0]?.confidenceLabel).toBe('result.confidence.high');
    expect(view.results[0]?.categoryLabel).toBe('result.category.actor');
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
      'I tried this fun vibe game and got: Sample Star with 84% style/vibe fit.',
    );
    expect(lowered).not.toContain('biometric');
    expect(lowered).not.toContain('face recognition');
    expect(lowered).not.toContain('identity');
    expect(lowered).not.toContain('{');
  });
});
