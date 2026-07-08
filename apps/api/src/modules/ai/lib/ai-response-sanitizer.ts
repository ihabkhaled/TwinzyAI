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

/**
 * Last-resort extraction of the JSON object embedded in a noisy response: the
 * substring from the first `{` to the last `}`. Used only after a direct parse
 * fails, to tolerate leading/trailing prose (e.g. "Here is the result:") the
 * model sometimes wraps around the JSON. Returns undefined when no object
 * delimiters are present. Never "fixes" the JSON — only trims surrounding noise.
 */
export const extractJsonObject = (raw: string): string | undefined => {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) {
    return undefined;
  }
  return raw.slice(start, end + 1);
};
