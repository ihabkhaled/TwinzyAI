import { describe, expect, it } from 'vitest';

import { containsForbiddenWording, findForbiddenPhrase } from '../lib/forbidden-wording.guard';

describe('forbidden-wording guard', () => {
  describe('containsForbiddenWording', () => {
    it('returns true when a forbidden phrase is present', () => {
      expect(containsForbiddenWording('This is face recognition.')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(containsForbiddenWording('This is FACE RECOGNITION.')).toBe(true);
    });

    it('returns false for safe playful text', () => {
      expect(containsForbiddenWording('A playful style/vibe match')).toBe(false);
    });

    it('returns true for sensitive topics', () => {
      expect(containsForbiddenWording('The ethnicity is similar')).toBe(true);
    });
  });

  describe('findForbiddenPhrase', () => {
    it('returns the first offending phrase', () => {
      expect(findForbiddenPhrase('You are the person we matched')).toBe('you are ');
    });

    it('returns undefined when text is safe', () => {
      expect(findForbiddenPhrase('Public style impression only')).toBeUndefined();
    });

    it('allows graded resemblance language post-pivot', () => {
      expect(
        findForbiddenPhrase('Closely resembles this actor — a strong visual lookalike match'),
      ).toBeUndefined();
    });
  });
});
