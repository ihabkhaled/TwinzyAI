import type { TranslationKey } from './en';
import { en } from './en';

/**
 * Returns the user-facing string for a key. Keys are compile-time checked,
 * so a typo or missing key is a TypeScript error, not a runtime blank.
 */
export const t = (key: TranslationKey): string => en[key];
