/**
 * Normalizes raw model output before JSON parsing:
 * - strips markdown code fences the model may wrap JSON in
 * - trims surrounding whitespace
 * Never "fixes" content — only removes wrapping noise. Anything else that
 * breaks JSON.parse is rejected upstream as AI_RESPONSE_INVALID.
 */
const OPENING_FENCE_PATTERN = /^```[a-z]*\s*/i;

const CLOSING_FENCE_PATTERN = /```\s*$/;

export const sanitizeAiResponseText = (raw: string): string =>
  raw.trim().replace(OPENING_FENCE_PATTERN, '').replace(CLOSING_FENCE_PATTERN, '').trim();
