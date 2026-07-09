/**
 * Phrases that must never appear in any AI output or user-facing result.
 * The backend rejects/sanitizes responses containing them; frontend tests
 * assert they never render. Single source of truth for both sides.
 *
 * Post-pivot semantics (visual-similarity mode, owner-approved): graded
 * resemblance language ("closely resembles", "strong visual match", lookalike
 * phrasing) is ALLOWED — it is the product. What stays banned:
 * - identity ASSERTIONS about who the user is ("you are …", "we identified"),
 * - clinical biometric-identification phrasing ("face recognition",
 *   "identity match", "biometric") — the product voice is playful resemblance,
 *   never surveillance vocabulary.
 */
export const FORBIDDEN_RESULT_PHRASES = [
  'face recognition',
  'facial recognition',
  'identity match',
  'identity matching',
  'biometric',
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
