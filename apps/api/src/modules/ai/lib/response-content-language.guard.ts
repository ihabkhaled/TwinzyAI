import type { LanguageCodeValue } from '@twinzy/shared';

import { buildIntegrationError, ErrorCode } from '../../../core/errors';
import { MIN_ARABIC_CONTENT_RATIO } from '../model/ai-safety.constants';
import { AI_INVALID_RESPONSE_MESSAGE } from '../model/gemini.constants';

const ARABIC_LETTER_PATTERN = /\p{Script=Arabic}/gu;
const LATIN_LETTER_PATTERN = /\p{Script=Latin}/gu;

const countMatches = (value: string, pattern: RegExp): number => {
  pattern.lastIndex = 0;
  let count = 0;
  let match = pattern.exec(value);
  while (match !== null) {
    count += 1;
    match = pattern.exec(value);
  }
  return count;
};

export const assertLocalizedContentLanguage = (
  values: readonly string[],
  languageCode: LanguageCodeValue,
  exclusions: readonly string[] = [],
): void => {
  if (languageCode !== 'ar') {
    return;
  }
  const excluded = new Set(exclusions);
  const content = values.filter((value) => !excluded.has(value)).join(' ');
  const arabicLetters = countMatches(content, ARABIC_LETTER_PATTERN);
  const latinLetters = countMatches(content, LATIN_LETTER_PATTERN);
  const languageLetters = arabicLetters + latinLetters;
  if (languageLetters > 0 && arabicLetters / languageLetters < MIN_ARABIC_CONTENT_RATIO) {
    throw buildIntegrationError(ErrorCode.AiResponseInvalid, AI_INVALID_RESPONSE_MESSAGE);
  }
};
