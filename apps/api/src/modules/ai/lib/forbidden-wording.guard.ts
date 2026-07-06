import { ALL_FORBIDDEN_PHRASES } from '../model/ai-safety.constants';

/**
 * Pure guard: does this text contain wording the game must never show?
 * Case-insensitive substring scan against the shared forbidden lists.
 */
export const containsForbiddenWording = (text: string): boolean => {
  const lowered = text.toLowerCase();
  return ALL_FORBIDDEN_PHRASES.some((phrase) => lowered.includes(phrase));
};

/** Returns the first offending phrase for diagnostics (never shown to users). */
export const findForbiddenPhrase = (text: string): string | undefined => {
  const lowered = text.toLowerCase();
  return ALL_FORBIDDEN_PHRASES.find((phrase) => lowered.includes(phrase));
};
