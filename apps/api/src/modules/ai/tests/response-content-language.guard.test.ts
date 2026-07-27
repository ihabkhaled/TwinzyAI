import { describe, expect, it } from 'vitest';

import { assertLocalizedContentLanguage } from '../lib/response-content-language.guard';

describe('assertLocalizedContentLanguage', () => {
  it('rejects English reasons and traits inside an Arabic response', () => {
    expect(() => {
      assertLocalizedContentLanguage(
        [
          'This candidate has a warm smile and balanced facial proportions.',
          'Strong eyebrow shape',
          'Uncertain jaw detail',
        ],
        'ar',
      );
    }).toThrow();
  });

  it('accepts Arabic public prose while ignoring canonical names, URLs, and entity IDs', () => {
    expect(() => {
      assertLocalizedContentLanguage(
        [
          'تتوافق هذه النتيجة مع الابتسامة الدافئة والانطباع المتوازن.',
          'حاجبان واضحان',
          'Dan Avidan',
          'Q100',
          'https://en.wikipedia.org/wiki/Dan_Avidan',
        ],
        'ar',
        ['Dan Avidan', 'Q100', 'https://en.wikipedia.org/wiki/Dan_Avidan'],
      );
    }).not.toThrow();
  });

  it('does not apply Arabic-script validation to other languages', () => {
    expect(() => {
      assertLocalizedContentLanguage(['English content'], 'en');
    }).not.toThrow();
  });
});
