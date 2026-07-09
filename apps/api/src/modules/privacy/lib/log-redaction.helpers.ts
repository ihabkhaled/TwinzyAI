import {
  BASE64_RUN_PATTERN,
  MAX_LOGGED_LENGTH,
  REDACTED_PLACEHOLDER,
  SECRET_KEY_PATTERN,
} from '../model/privacy.constants';

/**
 * Pure redaction primitive shared by the LogRedactionService and low-level
 * adapters (which may not import services across layer boundaries).
 * Guarantees image bytes (base64 runs) and secrets never reach a log line.
 */
export const redactForLog = (value: string): string =>
  value
    .slice(0, MAX_LOGGED_LENGTH)
    .replaceAll(BASE64_RUN_PATTERN, () => REDACTED_PLACEHOLDER)
    .replaceAll(
      SECRET_KEY_PATTERN,
      (_match, key: string, separator: string) => `${key}${separator}${REDACTED_PLACEHOLDER}`,
    );
