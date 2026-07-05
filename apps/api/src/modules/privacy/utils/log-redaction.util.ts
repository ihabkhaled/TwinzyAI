/** Long base64-looking runs — the signature of leaked binary/image data. */
const BASE64_RUN_PATTERN = /[a-z0-9+/=]{64,}/gi;

/** Bearer-style or key=value secrets. */
const KEY_PATTERN = /(key|token|authorization)([=:]\s*)\S+/gi;

const REDACTED = '[REDACTED]';

const MAX_LOGGED_LENGTH = 500;

/**
 * Pure redaction primitive shared by the LogRedactionService and low-level
 * adapters (which may not import services across layer boundaries).
 * Guarantees image bytes (base64 runs) and secrets never reach a log line.
 */
export const redactForLog = (value: string): string =>
  value
    .slice(0, MAX_LOGGED_LENGTH)
    .replaceAll(BASE64_RUN_PATTERN, REDACTED)
    .replaceAll(KEY_PATTERN, `$1$2${REDACTED}`);
