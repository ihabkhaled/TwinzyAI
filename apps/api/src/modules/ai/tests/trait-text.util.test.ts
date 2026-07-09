import { describe, expect, it } from 'vitest';

import { buildTraitExtraction } from '../../../tests/fixtures/fake-ai-adapter';
import { collectExtractionTextValues, collectTraitTextValues } from '../lib/trait-text.util';

describe('trait-text util', () => {
  it('collects all category field values', () => {
    const extraction = buildTraitExtraction();
    const values = collectTraitTextValues(extraction.traits);
    expect(values.length).toBeGreaterThan(0);
    expect(values).toContain('observed overallFaceShape');
  });

  it('collects uncertainty notes', () => {
    const extraction = buildTraitExtraction();
    extraction.traits.uncertaintyNotes.unclearCategories = ['low light on left side'];
    const values = collectTraitTextValues(extraction.traits);
    expect(values).toContain('low light on left side');
  });

  it('collects compact summary alongside traits', () => {
    const extraction = buildTraitExtraction();
    extraction.compactTraitSummary = ['clear oval face'];
    const values = collectExtractionTextValues(extraction);
    expect(values).toContain('clear oval face');
  });
});
