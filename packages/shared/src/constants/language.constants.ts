/**
 * Language codes the product ships end-to-end (frontend locales AND the
 * localized dynamic AI output contract). Single source of truth for both
 * sides: the web i18n locale set and the API `languageCode` field must stay
 * in lock-step with this list.
 */
export const LANGUAGE_CODES = [
  'en',
  'ar',
  'it',
  'fa',
  'fr',
  'de',
  'es',
  'pt',
  'hi',
  'th',
  'zh',
  'ja',
] as const;

export type LanguageCodeValue = (typeof LANGUAGE_CODES)[number];

/**
 * Each language's endonym (its name in its own script) — what a native speaker
 * scans for in a language picker, so these are deliberately NOT translated.
 */
export const LANGUAGE_ENDONYMS: Readonly<Record<LanguageCodeValue, string>> = {
  en: 'English',
  ar: 'العربية',
  it: 'Italiano',
  fa: 'فارسی',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  hi: 'हिन्दी',
  th: 'ไทย',
  zh: '中文',
  ja: '日本語',
};

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
