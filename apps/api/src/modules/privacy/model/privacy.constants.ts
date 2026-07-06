/**
 * Constants for log redaction. Centralized here so the pure helper and any
 * consumer share one source of truth instead of inlining patterns or caps.
 */

/** Long base64-looking runs — the signature of leaked binary/image data. */
export const BASE64_RUN_PATTERN = /[a-z0-9+/=]{64,}/gi;

/** Bearer-style or key=value / key:value secrets. */
export const SECRET_KEY_PATTERN = /(key|token|authorization)([=:]\s*)\S+/gi;

/** Placeholder substituted for any redacted content. */
export const REDACTED_PLACEHOLDER = '[REDACTED]';

/** Hard cap on how many characters of any value may reach a log line. */
export const MAX_LOGGED_LENGTH = 500;
