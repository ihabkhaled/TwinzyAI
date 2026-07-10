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
      expect(containsForbiddenWording('This person is attractive')).toBe(true);
      expect(containsForbiddenWording('Their sexual orientation is obvious')).toBe(true);
    });

    it('rejects Arabic identity and sensitive-inference wording', () => {
      expect(containsForbiddenWording('تم التعرّف على الوجه')).toBe(true);
      expect(containsForbiddenWording('أنت هو هذا الشخص')).toBe(true);
      expect(containsForbiddenWording('تبدو شخصيته انطوائية')).toBe(true);
    });
  });

  describe('findForbiddenPhrase', () => {
    it('returns the first offending phrase', () => {
      expect(findForbiddenPhrase('You are the person we matched')).toBe('you are ');
    });

    it('returns undefined when text is safe', () => {
      expect(findForbiddenPhrase('Public style impression only')).toBeUndefined();
    });

    it('rejects exact-lookalike wording', () => {
      expect(findForbiddenPhrase('This is an exact lookalike match')).toBe('exact lookalike');
      expect(findForbiddenPhrase('This person has the same face')).toBe('same face');
      expect(findForbiddenPhrase('This is an exact-lookalike match')).toBe('exact-lookalike');
    });
  });
});
