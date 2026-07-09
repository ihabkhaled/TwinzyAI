/** Chat-completions endpoint path appended to every provider base URL. */
export const CHAT_COMPLETIONS_PATH = '/chat/completions';

/**
 * Same deterministic-ish temperature the Gemini adapter uses — the pipeline
 * wants stable structured output, not creative variance, on every provider.
 */
export const OPENAI_COMPAT_TEMPERATURE = 0.4;
