/**
 * Phrases that must never appear in any AI output or user-facing result.
 * The backend rejects/sanitizes responses containing them; frontend tests
 * assert they never render. Single source of truth for both sides.
 */
export const FORBIDDEN_RESULT_PHRASES = [
  'face recognition',
  'facial recognition',
  'identity match',
  'identity matching',
  'biometric',
  'exact lookalike',
  'looks exactly like',
  'same face',
  'you are ',
  'the person is ',
  'recognized you',
  'we identified',
] as const;

/**
 * Sensitive inference topics the game must never output about a person.
 */
export const FORBIDDEN_SENSITIVE_TOPICS = [
  'ethnicity',
  'religion',
  'health condition',
  'attractiveness rating',
  'income',
  'nationality guess',
  'personality diagnosis',
] as const;
