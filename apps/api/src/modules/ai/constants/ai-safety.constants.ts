import { FORBIDDEN_RESULT_PHRASES, FORBIDDEN_SENSITIVE_TOPICS } from '@twinzy/shared';

/**
 * Every phrase that makes an AI response unshowable. Shared lists are the
 * single source; this constant just merges them for the scanner.
 */
export const ALL_FORBIDDEN_PHRASES: readonly string[] = [
  ...FORBIDDEN_RESULT_PHRASES,
  ...FORBIDDEN_SENSITIVE_TOPICS,
];
