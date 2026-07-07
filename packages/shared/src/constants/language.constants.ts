/**
 * Language codes the product ships end-to-end (frontend locales AND the
 * localized dynamic AI output contract). Single source of truth for both
 * sides: the web i18n locale set and the API `languageCode` field must stay
 * in lock-step with this list.
 */
export const LANGUAGE_CODES = ['en', 'ar'] as const;

export type LanguageCodeValue = (typeof LANGUAGE_CODES)[number];

/** Language used when a request omits or sends an unsupported code. */
export const DEFAULT_LANGUAGE_CODE: LanguageCodeValue = 'en';

/** Narrow an unknown value to a supported language code. */
export const isSupportedLanguageCode = (value: unknown): value is LanguageCodeValue =>
  typeof value === 'string' && (LANGUAGE_CODES as readonly string[]).includes(value);

/**
 * Normalize any client-provided language value to a supported code, falling
 * back to the default. Analyze requests NORMALIZE (friendly multipart UX);
 * the translate endpoint REJECTS instead via its strict schema.
 */
export const normalizeLanguageCode = (value: unknown): LanguageCodeValue =>
  isSupportedLanguageCode(value) ? value : DEFAULT_LANGUAGE_CODE;
