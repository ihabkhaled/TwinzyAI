export const GEMINI_PROVIDER_NAME = 'gemini';

/** Deterministic-ish output for a judging/extraction pipeline. */
export const GEMINI_TEMPERATURE = 0.4;

/** The pipeline requires raw JSON responses. */
export const GEMINI_RESPONSE_MIME_TYPE = 'application/json';

export const AI_UNAVAILABLE_MESSAGE =
  'The vibe engine is unavailable right now. Please try again in a moment.';

export const AI_RATE_LIMITED_MESSAGE =
  'The vibe engine is busy right now (usage limit reached). Please try again in a minute.';

export const AI_TIMEOUT_MESSAGE = 'The vibe engine took too long. Please try again.';

export const AI_INVALID_RESPONSE_MESSAGE =
  'The vibe engine returned something we could not read. Please try again.';

export const AI_UNSAFE_RESPONSE_MESSAGE =
  'The vibe engine returned a result we could not show. Please try another photo.';
