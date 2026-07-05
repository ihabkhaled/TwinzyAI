import { describe, expect, it } from 'vitest';

import { buildShareText, mapFinalResultToView } from '@/features/game/lib/game.mappers';
import { validateImageFile } from '@/features/game/lib/game.validators';
import { en } from '@/i18n/en';

import { buildFinalResult, buildImageFile } from './fixtures/game-fixtures';

describe('validateImageFile', () => {
  it('accepts a valid JPG under the size limit', () => {
    expect(validateImageFile(buildImageFile()).ok).toBe(true);
  });

  it('rejects a missing file', () => {
    const result = validateImageFile();
    expect(result).toEqual({ ok: false, errorKey: 'error.fileMissing' });
  });

  it('rejects a disallowed MIME type', () => {
    const result = validateImageFile(buildImageFile('photo.jpg', 'image/gif'));
    expect(result).toEqual({ ok: false, errorKey: 'error.fileTypeNotAllowed' });
  });

  it('rejects a disallowed extension even with an allowed MIME', () => {
    const result = validateImageFile(buildImageFile('photo.heic', 'image/jpeg'));
    expect(result).toEqual({ ok: false, errorKey: 'error.fileTypeNotAllowed' });
  });

  it('rejects an oversized file', () => {
    const result = validateImageFile(buildImageFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024));
    expect(result).toEqual({ ok: false, errorKey: 'error.fileTooLarge' });
  });
});

describe('mapFinalResultToView', () => {
  it('maps all 15 traits with labels and the results with score percent', () => {
    const view = mapFinalResultToView(buildFinalResult());

    expect(view.traits).toHaveLength(15);
    expect(view.traits[0]).toEqual({
      key: 'faceShape',
      label: en['trait.faceShape'],
      value: 'observed faceShape',
    });
    expect(view.results[0]?.scorePercent).toBe(87);
    expect(view.results[0]?.verdictLabel).toBe(en['game.verdict.strong']);
    expect(view.disclaimer).toBe(en['game.disclaimer']);
  });
});

describe('buildShareText', () => {
  it('builds safe share text with name and score only', () => {
    const view = mapFinalResultToView(buildFinalResult());

    expect(view.shareText).toBe(
      'I tried this fun vibe game and got: Sample Star with 87% style/vibe fit.',
    );
  });

  it('returns an empty string when there is no result', () => {
    expect(buildShareText([])).toBe('');
  });

  it('contains no photo data, trait JSON, or forbidden wording', () => {
    const view = mapFinalResultToView(buildFinalResult());
    const lowered = view.shareText.toLowerCase();

    expect(lowered).not.toContain('blob:');
    expect(lowered).not.toContain('base64');
    expect(lowered).not.toContain('{');
    expect(lowered).not.toContain('face recognition');
    expect(lowered).not.toContain('biometric');
    expect(lowered).not.toContain('identity');
  });
});

describe('i18n dictionary safety', () => {
  it('contains no affirmative identity/biometric claim wording', () => {
    const allText = Object.values(en).join(' ').toLowerCase();
    const forbiddenClaims = [
      'looks exactly like',
      'same face',
      'recognized you',
      'exact lookalike',
      'biometric match',
      'you are [',
    ];
    for (const phrase of forbiddenClaims) {
      expect(allText).not.toContain(phrase);
    }
  });
});
